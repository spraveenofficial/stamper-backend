import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import mongoose from 'mongoose';
import redis from 'redis';
import { redisConfig } from '../redis/init';
import { BULL_AVAILABLE_JOBS } from './constants';
import { ApiError } from '../errors';
import { departmentService } from '../departments';
import { officeServices } from '../office';
import { jobTitleService } from '../jobTitles';
import { userService } from '../user';
import { employeeService } from '../employee';
import { tokenService } from '../token';
import { emailService } from '../email';
import { QueueTasks } from './mq.model';
import { IEmployeeBulkUploadPayload, NewEmployee } from '../employee/employee.interfaces';
import { NewUserAsEmployee } from '../user/user.interfaces';
import { QueueJobsStatus } from './types';
import config from '../../config/config';
import { DevelopmentOptions } from '../../config/roles';
import httpStatus from 'http-status';

const bulk_upload_name = 'bulk_upload';

// Redis Client
let redisClient = redis.createClient(redisConfig);

// Ensure Redis connection
const ensureRedisConnection = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('Connected to Redis');
    } catch (err) {
      console.error('Error connecting to Redis:', err);
      throw new Error('Failed to connect to Redis');
    }
  }
};

// Multi-fetch from Redis
const getMultipleFromRedis = async (keys: string[]) => {
  try {
    await ensureRedisConnection();
    const multi = redisClient.multi();
    keys.forEach((key) => multi.get(key));
    const results = await multi.exec();
    return results;
  } catch (err) {
    console.error('Error in multi-get:', err);
    throw err;
  }
};

const bulkUploadQueue = new Queue(bulk_upload_name, {
  connection: redisConfig,
});

// Process bulk upload job
const processJob = async (job: Job) => {
  const { data } = job;
  const result = {
    successCount: 0,
    failureCount: 0,
    errors: [] as { employee: string; position: number; error: string }[],
    userId: null,
  };

  try {
    if (data.type === BULL_AVAILABLE_JOBS.EMPLOYEE_BULK_UPLOAD) {
      const { organizationId, userId } = data;
      result.userId = userId;

      const queueTask = await QueueTasks.findOne({ userId, jobId: job.id });
      if (!queueTask) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Queue task not found');
      }

      const employeeDatas: IEmployeeBulkUploadPayload[] = data.employees;

      const departmentIds = employeeDatas.map((emp) => emp.department);
      const officeIds = employeeDatas.map((emp) => emp.office);
      const jobTitleIds = employeeDatas.map((emp) => emp.jobTitle);

      const [departmentsData, officesData, jobTitlesData] = await Promise.all([
        getMultipleFromRedis(departmentIds.map((id) => `department:${id}`)),
        getMultipleFromRedis(officeIds.map((id) => `office:${id}`)),
        getMultipleFromRedis(jobTitleIds.map((id) => `jobTitle:${id}`)),
      ]);

      const userPromises = employeeDatas.map(async (employeeData, index) => {
        try {
          const existingUser = await userService.getUserByEmail(employeeData.email);
          if (existingUser) {
            throw new ApiError(
              httpStatus.BAD_REQUEST,
              `${employeeData.email} already exists at position ${index + 1}`
            );
          }

          const employeeInformation: Partial<NewEmployee> = {
            departmentId: employeeData.department as unknown as mongoose.Types.ObjectId,
            officeId: employeeData.office as unknown as mongoose.Types.ObjectId,
            jobTitleId: employeeData.jobTitle as unknown as mongoose.Types.ObjectId,
            joiningDate: new Date(employeeData.joiningDate),
          };

          const user: NewUserAsEmployee & { phoneNumber: any } = {
            email: employeeData.email,
            name: employeeData.name,
            phoneNumber: employeeData.phoneNumber,
          };

          const department = departmentsData[index]
            ? JSON.parse(departmentsData[index] as string)
            : await departmentService.getDeparmentByIdAndOrgId(employeeInformation.departmentId!, organizationId);
          if (!department) throw new ApiError(httpStatus.BAD_REQUEST, 'Department not found');

          const office = officesData[index]
            ? JSON.parse(officesData[index] as string)
            : await officeServices.getOfficeById(employeeInformation.officeId!);
          if (!office) throw new ApiError(httpStatus.BAD_REQUEST, 'Office not found');

          const jobTitle = jobTitlesData[index]
            ? JSON.parse(jobTitlesData[index] as string)
            : await jobTitleService.getJobTitleById(employeeInformation.jobTitleId!);
          if (!jobTitle) throw new ApiError(httpStatus.BAD_REQUEST, 'Job title not found');

          const employee = await userService.createUserAsEmployee(user, organizationId);

          await employeeService.addEmployee({
            userId: employee.id,
            departmentId: department.id,
            officeId: office.id,
            jobTitleId: jobTitle.id,
            joiningDate: employeeData.joiningDate,
            organizationId,
          });

          const token = await tokenService.generateOrganizationInvitationToken(employee);
          if (config.env === DevelopmentOptions.production) {
            await emailService.inviteEmployee(employee.email, employee.name, employee.name, token);
          }

          result.successCount++;
          await queueTask.updateOne({ $set: { progress: (result.successCount / employeeDatas.length) * 100 } });
        } catch (error: any) {
          result.failureCount++;
          result.errors.push({
            employee: employeeData.email || 'Unknown',
            position: index + 1,
            error: error.message,
          });

          await queueTask.updateOne({
            $push: { error: `${error.message} (Position: ${index + 1})` },
            $set: { progress: (result.successCount / employeeDatas.length) * 100 },
          });
        }
      });

      await Promise.all(userPromises);
    }
  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
  return result;
};

export const bulkUploadWorker = new Worker(
  bulk_upload_name,
  async (job) => {
    const result = await processJob(job);
    job.updateProgress(result);
    return result;
  },
  {
    connection: redisConfig,
    concurrency: 20,
  }
);

const queueEvents = new QueueEvents(bulk_upload_name, { connection: redisConfig });

queueEvents.on('completed', async ({ jobId, returnvalue }: { jobId: string; returnvalue: any }) => {
  try {
    await QueueTasks.findOneAndUpdate(
      { jobId, userId: returnvalue.userId },
      {
        $set: {
          status: QueueJobsStatus.Completed,
          progress: 100,
          result: returnvalue,
          error: returnvalue.errors,
        },
      }
    );
    console.log(`Job ${jobId} has completed with result:`, JSON.stringify(returnvalue));
  } catch (error) {
    console.error(`Error updating DB for completed job ${jobId}:`, error);
  }
});

queueEvents.on('failed', async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
  try {
    await QueueTasks.findOneAndUpdate(
      { jobId },
      {
        $set: {
          status: QueueJobsStatus.Failed,
          error: failedReason,
        },
      }
    );
    console.error(`Job ${jobId} has failed:`, failedReason);
  } catch (dbError) {
    console.error(`Error updating DB for failed job ${jobId}:`, dbError);
  }
});

queueEvents.on('progress', async ({ jobId, data }: { jobId: string; data: number | object }) => {
  try {
    // Ensure `data` is a number before updating progress
    const progress = typeof data === 'number' ? data : 0; // Default to 0 if data is not a number

    await QueueTasks.findOneAndUpdate(
      { jobId },
      {
        $set: { progress },
      }
    );

    console.log(`Job ${jobId} progress: ${progress}%`);
  } catch (error) {
    console.error(`Error updating DB for progress event on job ${jobId}:`, error);
  }
});


queueEvents.on('waiting', async (jobId: any) => {
  console.log(`Job ${jobId} is waiting`);
});

queueEvents.on('active', async (jobId: any) => {
  console.log(`Job ${jobId} is active`);
});

queueEvents.on('stalled', async (jobId: any) => {
  console.log(`Job ${jobId} has stalled`);
});


console.log('Bulk upload worker started');

export { bulkUploadQueue };
