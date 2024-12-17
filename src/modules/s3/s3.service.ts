import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../logger';
import config from '../../config/config';

// Initialize the S3 Client
const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: config.AWS_S3_ACCESS_KEY,
    secretAccessKey: config.AWS_S3_KEY_SECRET,
  },
});

/**
 * Upload a user's profile picture to S3
 * @param {Express.Multer.File} file
 * @param {string} userId
 * @returns {Promise<string>}
 */
export const uploadUserProfilePicture = async (file: Express.Multer.File, userId: string): Promise<string> => {
  const params = {
    Bucket: config.AWS_S3_PUBLIC_BUCKET,
    Key: `profilePicture/${userId}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    const objectUrl = `https://${config.CLOUDFRONT_DOMAIN}/profilePicture/${userId}`;
    return objectUrl;
  } catch (error) {
    logger.error(`Error uploading file to S3: ${error}`);
    throw new Error('Error uploading file to S3');
  }
};

/**
 * Upload a file for a leave request
 * @param {Express.Multer.File} file
 * @param {string} userId
 * @returns {Promise<string>}
 */
export const uploadLeaveRequestFile = async (file: Express.Multer.File, userId: string): Promise<string> => {
  const params = {
    Bucket: config.AWS_S3_PUBLIC_BUCKET,
    Key: `users/${userId}/leaveRequest/${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentDisposition: 'inline',
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    const objectUrl = `https://${config.CLOUDFRONT_DOMAIN}/users/${userId}/leaveRequest/${file.originalname}`;
    return objectUrl;
  } catch (error) {
    logger.error(`Error uploading file to S3: ${error}`);
    throw new Error('Error uploading file to S3');
  }
};
