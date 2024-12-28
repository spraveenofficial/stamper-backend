import mongoose, { PipelineStage } from 'mongoose';
import { QueueTasks } from './mq.model';
import { IQueueTasks, NewQueueTask } from './types';
import { BULL_AVAILABLE_JOBS } from './constants';

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

export const getQueueTasksByUserId = async (
  userId: mongoose.Types.ObjectId,
  type: string,
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  const user = await new mongoose.Types.ObjectId(userId);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        userId: user,
        jobType: type,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $facet: {
        // Get total count before pagination
        metadata: [{ $count: 'totalCount' }],
        // Get paginated data
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $addFields: {
              id: '$_id',
            },
          },
          {
            $project: {
              _id: 0,
              error: 0,
              __v: 0,
              userId: 0,
              data: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$metadata',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        results: '$data',
        page: { $literal: page },
        limit: { $literal: limit },
        totalResults: { $ifNull: ['$metadata.totalCount', 0] },
        totalPages: {
          $ifNull: [{ $ceil: { $divide: ['$metadata.totalCount', limit] } }, 0],
        },
      },
    },
  ];

  const response = await QueueTasks.aggregate(pipeline);

  return response.length ? response[0] : { results: [], page: 1, limit, totalResults: 0, totalPages: 0 };
};

export const getBulkUploadInformationForEachTask = async (
  userId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId
): Promise<any> => {

  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    _id: new mongoose.Types.ObjectId(taskId),
    jobType: BULL_AVAILABLE_JOBS.EMPLOYEE_BULK_UPLOAD,
  };

  const pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    {
      $addFields: {
        id: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
        __v: 0,
        userId: 0,
        data: 0,
      },
    },
  ];

  const response = await QueueTasks.aggregate(pipeline);

  return response.length ? response[0] : null;
};
