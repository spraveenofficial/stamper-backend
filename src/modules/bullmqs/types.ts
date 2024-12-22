import mongoose, { Document, Model } from 'mongoose';

import { QueryResult } from "../paginate/paginate";

export enum QueueJobsStatus {
  Completed = 'completed',
  Failed = 'failed',
  Active = 'active',
  Waiting = 'waiting',
  Delayed = 'delayed',
}

export interface IQueueTasks {
  userId: mongoose.Types.ObjectId;
  jobId: string;
  jobType: string;
  dataToProcess: number;
  failureCount: number;
  data: any[];
  error: string[];
  status: QueueJobsStatus;
  progress: number;
  attemptsMade: number;
}

export interface IQueueTasksDoc extends IQueueTasks, Document {}

export interface IQueueTasksModel extends Model<IQueueTasks> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}


export type NewQueueTask = Omit<IQueueTasks, | 'status' | 'progress' | 'attemptsMade' | 'error' | 'failureCount'>;