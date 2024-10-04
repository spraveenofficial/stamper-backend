import config from '../../config/config';
import { logger } from '../logger';
import S3 from 'aws-sdk/clients/s3.js'; 

const s3 = new S3({
  accessKeyId: config.AWS_S3_ACCESS_KEY,
  secretAccessKey: config.AWS_S3_KEY_SECRET,
  region: 'ap-south-1'
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
    Key: `users/${userId}/profilePicture/${file.originalname}`,
    Body: file.buffer,
  };

  try {
    const { Location } = await s3.upload(params).promise();
    return Location;
  } catch (error) {
    throw new Error('Error uploading file to S3');
  }
};


/**
 * Upload a Pdf, Image, or any file on leave request
 * @param {Express.Multer.File} file
 * @param {string} userId
 * @returns {Promise<string>}
 */

export const uploadLeaveRequestFile = async (file: Express.Multer.File, userId: string): Promise<string> => {
  const params = {
    Bucket: config.AWS_S3_PUBLIC_BUCKET,
    Key: `users/${userId}/leaveRequest/${file.originalname}`,
    Body: file.buffer,
    fileType: file.mimetype,
    contentDisposition: 'inline',
  };
  try {
    const { Location } = await s3.upload(params).promise();
    return Location;
  } catch (error) {
    logger.error(`Error uploading file to S3 ========>: ${error}`);
    throw new Error('Error uploading file to S3');
  }
};
