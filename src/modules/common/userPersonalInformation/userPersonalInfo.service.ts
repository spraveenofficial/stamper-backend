import mongoose from 'mongoose';
import { IUserPersonalInfoDoc, NewUserPersonalInfoPayload } from './userPersonalInfo.interface';
import UserPersonalInfo from './userPersonalInfo.model';

export const createOneUserPersonalInfo = async (
  userId: mongoose.Types.ObjectId,
  payload: NewUserPersonalInfoPayload
): Promise<IUserPersonalInfoDoc> => {
  const newUserPersonalInfo = await UserPersonalInfo.create({ ...payload, userId: userId });
  return newUserPersonalInfo as IUserPersonalInfoDoc;
};

export const updateOneUserPersonalInfo = async (
  userId: mongoose.Types.ObjectId,
  payload: NewUserPersonalInfoPayload
): Promise<IUserPersonalInfoDoc> => {
  const updatedUserPersonalInfo = await UserPersonalInfo.findOneAndUpdate({ userId: userId }, payload, { new: true });
  return updatedUserPersonalInfo as IUserPersonalInfoDoc;
};

export const getOneUserPersonalInfo = async (userId: mongoose.Types.ObjectId): Promise<IUserPersonalInfoDoc | null> => {
  const userPersonalInfo = await UserPersonalInfo.findOne({ userId: userId });
  return userPersonalInfo;
};
