import * as AWS from 'aws-sdk';
import config from 'src/config/config';

const s3 = new AWS.S3({
  accessKeyId: config.AWS_S3_ACCESS_KEY,
  secretAccessKey: config.AWS_S3_KEY_SECRET,
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
