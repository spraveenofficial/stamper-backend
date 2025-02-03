import { CronJob } from 'cron';
import { logger } from '../logger';
import { Subscription } from '../subscriptions';
import { SubscriptionStatusEnum } from '../subscriptions/subscriptions.interfaces';

class StamperCronServices {
    private cronJobs: CronJob[] = [];

    /**
     * Check for organization plan expiry at 12:00 AM every day and update the plan status
     */
    private async checkForOrganizationPlanExpiry() {
        try {
            logger.info('Checking for organization plan expiry...');

            // Get all organizations with active plans
            const activePlans = await Subscription.find({ status: 'active' });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const plan of activePlans) {
                const planEndDate = new Date(plan.endDate);
                planEndDate.setHours(0, 0, 0, 0);
                if (planEndDate.getTime() === today.getTime()) {
                    // Update the plan status to expired
                    await Subscription.updateOne(
                        { _id: plan._id }, 
                        { $set: { status: SubscriptionStatusEnum.EXPIRED } } 
                    );
                    logger.info(`Plan ${plan._id} has expired.`);
                }
            }
        } catch (error) {
            logger.error('Error in checkForOrganizationPlanExpiry:', error);
        }
    }

    /**
     * Example cron job that runs every minute
     */
    private async callEveryMinute() {
        try {
            logger.info('Running every minute...');
            // Add your logic here
        } catch (error) {
            logger.error('Error in callEveryMinute:', error);
        }
    }

    /**
     * Initialize and start all cron jobs
        */
    public startAllCronJobs() {
        // Add all cron jobs to the array
        this.cronJobs.push(
            new CronJob('0 0 0 * * *', this.checkForOrganizationPlanExpiry.bind(this)), // Daily at 12:00 AM
            new CronJob('* * * * *', this.callEveryMinute.bind(this)) // Every minute
        );

        // Start all cron jobs
        this.cronJobs.forEach((job) => job.start());
        logger.info('All cron jobs started.');
    }

    /**
     * Stop all cron jobs
     */
    public stopAllCronJobs() {
        this.cronJobs.forEach((job) => job.stop());
        logger.info('All cron jobs stopped.');
    }
}

export const stamperCronService = new StamperCronServices();