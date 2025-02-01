import { createClient } from 'redis';
import config from '../../config/config';
import { logger } from '../logger';

const redisConfig = {
  // url: 'rediss://default:AV7EAAIjcDEwNDZjM2FmYTJmMGY0MWM0YTRkMDg4YjU1Y2M1MDdhMnAxMA@modest-boa-24260.upstash.io:6379',
  // url: 'redis://default:K6153aBnDfguJ0ulA2LiKN9TtjoxMFbN@redis-12284.c325.us-east-1-4.ec2.redns.redis-cloud.com:12284',
  // url: 'redis://localhost:6379',
  url: config.REDIS_CONNECTION_URL,
};

// Create a Redis client with proper configuration for production
const client = createClient(redisConfig);

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

const connectRedis = async () => {
  try {
    await client.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
    process.exit(1); // Exit the process in case Redis connection fails
  }
};

export { connectRedis, client as redisClient, redisConfig };
