import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { rolesEnum } from '../../config/roles';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { redisService } from '../redis/redis-service';
import { IUserDoc, NewCreatedUser, NewUserAsEmployee, UpdateUserBody } from './user.interfaces';
import User from './user.model';

/**
 * Register a user as an organization
 * @param {NewCreatedUser} userBody
 * @returns {Promise<IUserDoc>}
 */

export const createUserAsOrganization = async (userBody: NewCreatedUser, t: (key: string) => string): Promise<IUserDoc> => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, t('Auth.emailAlreadyExists'));
  }
  return User.create(userBody);
};

/**
 * Register a user as an employee
 * @param {NewRegisteredUser} userBody
 * @returns {Promise<IUserDoc>}
 */

export const createUserAsEmployee = async (
  userBody: NewUserAsEmployee,
  t?: (key: string) => string // Make t optional
): Promise<IUserDoc> => {
  if (await User.isEmailTaken(userBody.email)) {
    // If t is provided, use it; otherwise, fall back to a default message in English
    const errorMessage = t ? t('Auth.emailAlreadyExists') : 'Email already exists';
    throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
  }
  return User.create({ ...userBody, role: rolesEnum.employee });
};

export const createUsersAsEmployees = async (users: NewUserAsEmployee[]): Promise<IUserDoc[]> => {
  return User.insertMany(users);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryUsers = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserById = async (id: mongoose.Types.ObjectId): Promise<IUserDoc | null> => {

  const redisQueryKey = `user:${id}`;

  const redisQueryExists = await redisService.get(redisQueryKey);

  if (redisQueryExists) {
    return redisQueryExists as IUserDoc
  }

  const response = await User.findById(id);

  console.log("fresh query")
  if (response) await redisService.set(redisQueryKey, response, 3600);

  return response;
};


/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByEmail = async (email: string): Promise<IUserDoc | null> => await User.findOne({ email });

/**
 * Update user by id
 * @param {mongoose.Types.ObjectId} userId
 * @param {UpdateUserBody} updateBody
 * @returns {Promise<IUserDoc | null>}
 */
export const updateUserById = async (
  userId: mongoose.Types.ObjectId,
  updateBody: UpdateUserBody
): Promise<IUserDoc | null> => {
  const user = await User.findById(userId);
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user!, updateBody);
  await redisService.delete(`user:${userId}`)
  await user!.save();
  return user;
};

/**
 * Delete user by id
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IUserDoc | null>}
 */
export const deleteUserById = async (userId: mongoose.Types.ObjectId): Promise<IUserDoc | null> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.deleteOne();
  return user;
};

/**
 * Update user password
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<IUserDoc>}
 */

export const updatePassword = async (userId: string, password: string): Promise<IUserDoc> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  user.password = password;
  await user.save();
  return user;
};

export const updateProfilePicture = async (userId: string, url: string): Promise<IUserDoc> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  user.profilePic = url;
  await user.save();
  return user;
};
