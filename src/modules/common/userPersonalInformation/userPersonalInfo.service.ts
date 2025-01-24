import mongoose from 'mongoose';
import { userService } from '../../../modules/user';
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
  const userPersonalInfo = await UserPersonalInfo.findOne({ userId: userId });
  // If user personal info does not exist, create one
  // Check if payload contains name or phoneNumber
  if (payload.name || payload.phoneNumber) {
    const updateData: Partial<{ name: string; phoneNumber: string }> = {};

    if (payload.name) {
      updateData.name = payload.name;
    }

    if (payload.phoneNumber) {
      updateData.phoneNumber = payload.phoneNumber;
    }

    if (Object.keys(updateData).length > 0) {
      await userService.updateUserById(userId, updateData);
    }
  }

  if (!userPersonalInfo) {
    const newUserPersonalInfo = await UserPersonalInfo.create({ ...payload, userId: userId });
    return newUserPersonalInfo as IUserPersonalInfoDoc;
  }
  const updatedUserPersonalInfo = await UserPersonalInfo.findOneAndUpdate({ userId: userId }, payload, { new: true });
  return updatedUserPersonalInfo as IUserPersonalInfoDoc;
};

export const getOneUserPersonalInfo = async (userId: mongoose.Types.ObjectId): Promise<IUserPersonalInfoDoc | null> => {
  const userPersonalInfo = await UserPersonalInfo.findOne({ userId: userId });
  return userPersonalInfo;
};
