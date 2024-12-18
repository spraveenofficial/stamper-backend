import mongoose from 'mongoose';
import { IQueueTasksDoc, IQueueTasksModel, QueueJobsStatus } from './types';
import { toJSON } from '../toJSON';

const Schema = mongoose.Schema;

const mqSchema = new Schema<IQueueTasksDoc, IQueueTasksModel>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      required: true,
    },
    data: {
      type: [],
      required: true,
      default: [],
    },
    error: {
      type: [String],
      required: true,
      default: [],
    },
    status: {
      type: String,
      required: false,
      enum: QueueJobsStatus,
      default: QueueJobsStatus.Active,
    },
    progress: {
      type: Number,
      required: false,
      default: 0,
    },
    attemptsMade: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

mqSchema.index({ status: 1 });

mqSchema.plugin(toJSON);

export const QueueTasks = mongoose.model<IQueueTasksDoc, IQueueTasksModel>('QueueTasks', mqSchema);
