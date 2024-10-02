import mongoose from 'mongoose';
import News from './news.model';
import { INewsDoc } from './news.interfaces';

export const createNews = async (payload: any, userId: mongoose.Types.ObjectId): Promise<INewsDoc> => {
  return await News.create({
    ...payload,
    createdBy: userId,
  });
};
