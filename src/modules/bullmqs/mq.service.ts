import mongoose from 'mongoose';
import { QueueTasks } from './mq.model';
import { IQueueTasks, NewQueueTask } from './types';

/**
 * 
 * @param payload 
 * @returns 
 */
export const createNewQueueTask = async (payload: NewQueueTask): Promise<IQueueTasks> => {
  return await QueueTasks.create(payload);
};

/**
 * 
 * @param taskId 
 * @returns 
 */
export const getQueueTaskByTaskIdAndUserId = async (taskId: string, userId: mongoose.Types.ObjectId): Promise<any> => {
  return await QueueTasks.findOne({ taskId, userId });
};
