import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { redisConfig } from '../redis/init';
import { employeeService } from '../employee';
import { notificationInterfaces, notificationServices } from '../notification';
import { BULL_AVAILABLE_JOBS } from './constants';
import mongoose from 'mongoose';

// Queue name for latest news notifications
const latest_news_name = 'latest_news';

// Initialize Queue for handling latest news notifications
const newNewsQueue = new Queue(latest_news_name, {
  connection: redisConfig,
});

// Worker function to process the jobs from the queue
const processJob = async (job: Job) => {
  const { data } = job;

  try {
    console.log('Processing job data:', data);

    // Check if it's a NEWS notification
    if (data.type === BULL_AVAILABLE_JOBS.NEWS_PUBLICATION_NOTIFICATION) {
      // Logic to fetch and notify employees
      const { userId, organizationId, newsTitle, newsId } = data;

      // Simulated logic for fetching employees and creating notifications
      const employees = await employeeService.getEmployeesByOrgIdWithoutLimit(organizationId);
      const notifications = employees.map((employee: any) => ({
        to: employee.employeeId,
        from: new mongoose.Types.ObjectId(userId),
        message: `New news posted: ${newsTitle}`,
        seen: false,
        url: `/news/${newsId}`,
        type: notificationInterfaces.NotificationTypes.NEWS_PUBLICATION,
      }));

      console.log('Notifications:', notifications);
      // Simulate saving notifications to the database
      await notificationServices.insertManyNotifications(notifications);
      console.log(`Notifications sent for news: ${newsTitle}`);
    }
  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
};

// Worker to process jobs with concurrency set
export const newsWorker = new Worker(latest_news_name, processJob, {
  connection: redisConfig,
  concurrency: 5,
});

// QueueEvents for job lifecycle events
const queueEvents = new QueueEvents(latest_news_name, {
  connection: redisConfig,
});

queueEvents.on('completed', (job: any) => {
  console.log(`Job completed successfully: ${JSON.stringify(job)}`);
});

queueEvents.on('failed', (job: any, err: any) => {
  console.error(`Job failed: ${job.id}, Error: ${err.message}`);
});

queueEvents.on('active', (job: any) => {
  console.log(`Job is now active: ${JSON.stringify(job)}`);
});

console.log('News Queue and Worker are set up.');

export { newNewsQueue };
