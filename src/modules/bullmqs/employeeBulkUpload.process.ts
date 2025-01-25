import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { ApiError } from '../errors';
import { departmentService } from '../departments';
import { officeServices } from '../office';
import { jobTitleService } from '../jobTitles';
import { userService } from '../user';
import { employeeService } from '../employee';
import { tokenService } from '../token';
import { emailService } from '../email';
import { QueueTasks } from './mq.model';
import { IEmployeeBulkUploadPayload } from '../employee/employee.interfaces';
import { QueueJobsStatus } from './types';
import config from '../../config/config';
import { DevelopmentOptions } from '../../config/roles';
import httpStatus from 'http-status';
import { BULL_AVAILABLE_JOBS } from './constants';

// Constants
const QUEUE_NAME = 'bulk_upload';
const BATCH_SIZE = 100;
const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

// Redis connection
const redisConfig = {
  host: 'redis-12284.c325.us-east-1-4.ec2.redns.redis-cloud.com',
  port: 12284,
  username: 'default',
  password: 'K6153aBnDfguJ0ulA2LiKN9TtjoxMFbN',
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

const redis = new Redis(redisConfig);

// Redis cache helpers
class RedisCache {
  private static async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Redis cache error for key ${key}:`, error);
      return null;
    }
  }

  private static async setInCache(key: string, data: any): Promise<void> {
    try {
      await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    } catch (error) {
      console.error(`Redis cache set error for key ${key}:`, error);
    }
  }

  static async batchGet(keys: string[]): Promise<(string | null)[]> {
    if (!keys.length) return [];
    try {
      return await redis.mget(keys);
    } catch (error) {
      console.error('Redis batch get error:', error);
      return keys.map(() => null);
    }
  }

  static async getDepartment(id: string, organizationId: mongoose.Types.ObjectId) {
    const cacheKey = `department:${id}`;
    const cachedData = await this.getFromCache<any>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    const department = await departmentService.getDeparmentByIdAndOrgId(
      id as unknown as mongoose.Types.ObjectId,
      organizationId
    );

    if (department) {
      await this.setInCache(cacheKey, department);
    }

    return department;
  }

  static async getOffice(id: string) {
    const cacheKey = `office:${id}`;
    const cachedData = await this.getFromCache<any>(cacheKey);
    
    if (cachedData) {
      console.log("Offied cached data", cachedData);
      return cachedData;
    }

    const office = await officeServices.getOfficeById(id as unknown as mongoose.Types.ObjectId);
    
    if (office) {
      await this.setInCache(cacheKey, office);
    }

    return office;
  }

  static async getJobTitle(id: string) {
    const cacheKey = `jobTitle:${id}`;
    const cachedData = await this.getFromCache<any>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    const jobTitle = await jobTitleService.getJobTitleById(id as unknown as mongoose.Types.ObjectId);
    
    if (jobTitle) {
      await this.setInCache(cacheKey, jobTitle);
    }

    return jobTitle;
  }
}

// Process single employee
async function processEmployee(
  employeeData: IEmployeeBulkUploadPayload,
  organizationId: string,
  cachedData: {
    department?: any;
    office?: any;
    jobTitle?: any;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const existingUser = await userService.getUserByEmail(employeeData.email);
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, `${employeeData.email} already exists`);
    }

    // Validate and get related entities with caching
    const department = cachedData.department || 
      await RedisCache.getDepartment(
        employeeData.department as string,
        organizationId as unknown as mongoose.Types.ObjectId
      );
    if (!department) throw new ApiError(httpStatus.BAD_REQUEST, 'Department not found');

    const office = cachedData.office || 
      await RedisCache.getOffice(employeeData.office as string);
    if (!office) throw new ApiError(httpStatus.BAD_REQUEST, 'Office not found');

    const jobTitle = cachedData.jobTitle || 
      await RedisCache.getJobTitle(employeeData.jobTitle as string);
    if (!jobTitle) throw new ApiError(httpStatus.BAD_REQUEST, 'Job title not found');

    // Create user and employee
    const user = await userService.createUserAsEmployee({
      email: employeeData.email,
      name: employeeData.name,
      phoneNumber: employeeData.phoneNumber,
    });

    await employeeService.addEmployee({
      userId: user.id,
      departmentId: department.id,
      officeId: office.id,
      jobTitleId: jobTitle.id,
      joiningDate: employeeData.joiningDate,
      organizationId,
    });

    if (config.env === DevelopmentOptions.production) {
      const token = await tokenService.generateOrganizationInvitationToken(user);
      await emailService.inviteEmployee(user.email, user.name, user.name, token);
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to process employee',
    };
  }
}

// Process job implementation
async function processJob(job: Job) {
  const { data } = job;
  const result = {
    successCount: 0,
    failureCount: 0,
    errors: [] as { employeeName: string; email: string; error: string }[],
    userId: data.userId,
  };

  if (data.type !== BULL_AVAILABLE_JOBS.EMPLOYEE_BULK_UPLOAD) {
    throw new Error('Invalid job type');
  }

  const queueTask = await QueueTasks.findOne({
    userId: data.userId,
    jobId: job.id,
  });

  if (!queueTask) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Queue task not found');
  }

  const employees: IEmployeeBulkUploadPayload[] = data.employees;
  const totalEmployees = employees.length;

  // Process in batches
  for (let i = 0; i < totalEmployees; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE);

    // Pre-fetch cache data for the batch
    const departmentIds = batch.map((emp) => emp.department);
    const officeIds = batch.map((emp) => emp.office);
    const jobTitleIds = batch.map((emp) => emp.jobTitle);

    const [departmentsData, officesData, jobTitlesData] = await Promise.all([
      RedisCache.batchGet(departmentIds.map((id) => `department:${id}`)),
      RedisCache.batchGet(officeIds.map((id) => `office:${id}`)),
      RedisCache.batchGet(jobTitleIds.map((id) => `jobTitle:${id}`)),
    ]);

    // Process batch
    await Promise.all(
      batch.map(async (employeeData, index) => {
        const cachedData = {
          department: departmentsData[index] ? JSON.parse(departmentsData[index]!) : null,
          office: officesData[index] ? JSON.parse(officesData[index]!) : null,
          jobTitle: jobTitleIds[index] ? JSON.parse(jobTitlesData[index]!) : null,
        };

        const processResult = await processEmployee(employeeData, data.organizationId, cachedData);

        if (processResult.success) {
          result.successCount++;
        } else {
          result.failureCount++;
          result.errors.push({
            employeeName: employeeData.name || 'Unknown',
            email: employeeData.email,
            error: processResult.error || 'Unknown error',
          });
        }

        // Update progress after each employee
        const progress = ((i + index + 1) / totalEmployees) * 100;
        await job.updateProgress(progress);
        await queueTask.updateOne({
          $set: {
            progress,
            failureCount: result.failureCount,
          },
        });
      })
    );
  }

  return result;
}

// Rest of the code remains the same...
const bulkUploadQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const bulkUploadWorker = new Worker(QUEUE_NAME, processJob, {
  connection: redis,
  concurrency: 5,
  limiter: {
    max: 1000,
    duration: 5000,
  },
});

const queueEvents = new QueueEvents(QUEUE_NAME, { connection: redis });

// Event handlers...
queueEvents.on('waiting', async ({ jobId, data }: any) => {
  console.log("Job waiting", jobId, data);
});

queueEvents.on('progress', async ({ jobId, data, progress }: any) => {
  try {
    await QueueTasks.findOneAndUpdate({ jobId, userId: data.userId }, { $set: { progress } });
  } catch (error) {
    console.error(`Error updating DB for job ${jobId}:`, error);
  }
});

queueEvents.on('active', async ({ jobId }: any) => {
  console.log("Job is active", jobId);
  try {
    await QueueTasks.findOneAndUpdate({ jobId }, { $set: { status: QueueJobsStatus.Active } });
  } catch (error) {
    console.error(`Error updating DB for active job ${jobId}:`, error);
  }
});

queueEvents.on('completed', async ({ jobId, returnvalue }: any) => {
  try {
    await QueueTasks.findOneAndUpdate(
      { jobId, userId: returnvalue.userId },
      {
        $set: {
          status: QueueJobsStatus.Completed,
          progress: 100,
          error: returnvalue.errors,
          failureCount: returnvalue.failureCount,
        },
      }
    );
  } catch (error) {
    console.error(`Error updating DB for completed job ${jobId}:`, error);
  }
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
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
  } catch (error) {
    console.error(`Error updating DB for failed job ${jobId}:`, error);
  }
});

async function shutdown() {
  await bulkUploadQueue.close();
  await bulkUploadWorker.close();
  await redis.quit();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('Bulk upload queue is running');

export { bulkUploadQueue };