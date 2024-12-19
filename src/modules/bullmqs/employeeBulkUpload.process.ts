import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { redisConfig } from '../redis/init';
import { BULL_AVAILABLE_JOBS } from './constants';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { DevelopmentOptions } from '../../config/roles';
import { ApiError } from '../errors';
import { departmentService } from '../departments';
import { officeServices } from '../office';
import { jobTitleService } from '../jobTitles';
import { userService } from '../user';
import { employeeService } from '../employee';
import { tokenService } from '../token';
import { emailService } from '../email';
import { IEmployeeBulkUploadPayload, NewEmployee } from '../employee/employee.interfaces';
import { NewUserAsEmployee } from '../user/user.interfaces';
import redis from 'redis';
import { QueueTasks } from './mq.model';
import config from '../../config/config';
import { QueueJobsStatus } from './types';

// Create Redis client
let redisClient = redis.createClient(redisConfig);

// Ensure the Redis client is connected
const ensureRedisConnection = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect(); // Connect if not already connected
      console.log('Connected to Redis');
    } catch (err) {
      console.error('Error connecting to Redis:', err);
      throw new Error('Failed to connect to Redis');
    }
  }
};

const bulk_upload_name = 'bulk_upload';

const bulkUploadQueue = new Queue(bulk_upload_name, {
  connection: redisConfig,
});

// Function to batch fetch data from Redis (multi-get)
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

// Function to process bulk upload job
const processJob = async (job: Job) => {
  const { data } = job;
  const result = {
    successCount: 0,
    failureCount: 0,
    errors: [] as { employee: string; error: string }[],
    userId: null,
  };

  try {
    console.log('Processing job data:', data);

    if (data.type === BULL_AVAILABLE_JOBS.EMPLOYEE_BULK_UPLOAD) {
      const { organizationId, userId } = data;
      const queueTask = await QueueTasks.findOne({ userId: new mongoose.Types.ObjectId(userId), jobId: job.id });
      
      console.log('result from db', queueTask);
      const employeeDatas: IEmployeeBulkUploadPayload[] = data.employees;
      result.userId = userId;

      // Collect department, office, and jobTitle IDs to fetch in batch
      const departmentIds = employeeDatas.map((emp) => emp.department);
      const officeIds = employeeDatas.map((emp) => emp.office);
      const jobTitleIds = employeeDatas.map((emp) => emp.jobTitle);

      // Fetch data in bulk from Redis
      const [departmentsData, officesData, jobTitlesData] = await Promise.all([
        getMultipleFromRedis(departmentIds.map((id) => `department:${id}`)),
        getMultipleFromRedis(officeIds.map((id) => `office:${id}`)),
        getMultipleFromRedis(jobTitleIds.map((id) => `jobTitle:${id}`)),
      ]);

      // Process employees in parallel
      const userPromises = employeeDatas.map(async (employeeData, index) => {
        const user: NewUserAsEmployee & { phoneNumber: any } = {
          email: employeeData.email,
          name: employeeData.name,
          phoneNumber: employeeData.phoneNumber,
        };

        const employeeInformation: Partial<NewEmployee> = {
          departmentId: employeeData.department as unknown as mongoose.Types.ObjectId,
          officeId: employeeData.office as unknown as mongoose.Types.ObjectId,
          jobTitleId: employeeData.jobTitle as unknown as mongoose.Types.ObjectId,
          joiningDate: new Date(employeeData.joiningDate),
        };

        try {
          const department = departmentsData[index]
            ? JSON.parse(departmentsData[index] as string)
            : await departmentService.getDeparmentByIdAndOrgId(employeeInformation.departmentId!, organizationId);
          if (!department) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Department not found');
          }

          const office = officesData[index]
            ? JSON.parse(officesData[index] as string)
            : await officeServices.getOfficeById(employeeInformation.officeId!);
          if (!office) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Office not found');
          }

          const jobTitle = jobTitlesData[index]
            ? JSON.parse(jobTitlesData[index] as string)
            : await jobTitleService.getJobTitleById(employeeInformation.jobTitleId!);
          if (!jobTitle) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Job title not found');
          }

          // Create user and add employee in parallel
          const employee = await userService.createUserAsEmployee(user);

          await employeeService.addEmployee({
            ...employeeInformation,
            userId: employee.id as mongoose.Types.ObjectId,
            managerId: office.managerId as mongoose.Types.ObjectId,
            organizationId: organizationId as mongoose.Types.ObjectId,
            officeId: office.id as mongoose.Types.ObjectId,
            departmentId: department.id as mongoose.Types.ObjectId,
          });

          // Generate token and send invite email
          const token = await tokenService.generateOrganizationInvitationToken(employee);

          if (config.env == DevelopmentOptions.production) {
            await emailService.inviteEmployee(employee.email, employee.name, employee.name, token);
          }

          console.log('Employee added and invite sent:', employee.email);
          result.successCount++;

          await queueTask?.updateOne({
            $set: {
              progress: (result.successCount / employeeDatas.length) * 100, // Update progress
            },
          });
        } catch (error: any) {
          console.error('Error adding employee:', error);
          result.failureCount++;
          result.errors.push({ employee: user.email || 'Unknown', error: error.message });
          await queueTask?.updateOne({
            $push: {
              error: error.message, // Store the error message
            },
            $set: {
              progress: (result.successCount / employeeDatas.length) * 100, // Update progress
              attemptsMade: queueTask.attemptsMade + 1,
            },
          });
        }
      });

      await Promise.all(userPromises); // Process all employees in parallel
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
    concurrency: 20, // Increase concurrency for faster processing
  }
);

// Set up queue events
const queueEvents = new QueueEvents(bulk_upload_name, {
  connection: redisConfig,
});

queueEvents.on('completed', async (jobId: any, result: any) => {
  await QueueTasks.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(jobId.returnvalue.userId), jobId: jobId.jobId },
    {
      $set: {
        status: QueueJobsStatus.Completed,
        progress: 100,
        result,
        error: result.errors,
      },
    }
  );
  console.log(`Job ${JSON.stringify(jobId)} has completed with result:`, JSON.stringify(result));
});

queueEvents.on('failed', async (jobId: any) => {
  console.log(`Job ${jobId} has failed`);
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

queueEvents.on('progress', async (jobId: any, progress: any) => {
  console.log(`Job ${jobId} progress:`, progress);
});

console.log('Bulk upload worker started');

export { bulkUploadQueue };
