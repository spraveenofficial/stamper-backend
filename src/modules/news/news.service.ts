import mongoose from 'mongoose';
import News from './news.model';
import { INewsDoc, NewNewsType } from './news.interfaces';
import { rolesEnum } from 'src/config/roles';

export const createNews = async (
  payload: NewNewsType,
  userId: mongoose.Types.ObjectId,
  organizationId: mongoose.Types.ObjectId
): Promise<INewsDoc> => {
  // TODO: Create notification for all users in the organization and email notification
  return await News.create({
    ...payload,
    organizationId,
    createdBy: userId as mongoose.Types.ObjectId,
  });
};

export const getLatestNews = async (
  organizationId: mongoose.Types.ObjectId,
  scope: rolesEnum,
  page: number = 1,
  limit: number = 10
): Promise<INewsDoc[]> => {
  const skip = (page - 1) * limit;
  const orgId = new mongoose.Types.ObjectId(organizationId);

  const news = await News.aggregate([
    { $match: { organizationId: orgId, access: { $in: [scope] } } },
    { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdByInfo' } },
    { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        id: '$_id',
        createdByName: '$createdByInfo.name',
        createdByEmail: '$createdByInfo.email',
        createdByProfilePic: '$createdByInfo.profilePic',
      },
    },
    {
      $project: {
        createdByInfo: 0,
        _id: 0,
        __v: 0,
        updatedAt: 0,
        organizationId: 0,
        createdBy: 0,
      },
    },
    {
      $facet: {
        metadata: [
          { $count: 'totalCount' }, // Count total documents
          { $addFields: { page, limit } }, // Include page and limit in metadata
        ],
        data: [
          { $skip: skip }, // Skip for pagination
          { $limit: limit }, // Limit the number of results
        ],
      },
    },
    {
      $unwind: '$metadata', // Unwind the metadata array
    },
    {
      $project: {
        results: '$data',
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalResults: '$metadata.totalCount',
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', '$metadata.limit'] },
        },
      },
    },
  ]);

  return news[0] || { success: true, data: { results: [] }, page, limit, totalPages: 0, totalResults: 0 };
};

export const getNewsById = async (id: string): Promise<INewsDoc> => {
  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdByInfo' } },
    { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        id: '$_id',
        createdByName: '$createdByInfo.name',
        createdByEmail: '$createdByInfo.email',
        createdByProfilePic: '$createdByInfo.profilePic',
      },
    },
    {
      $project: {
        createdByInfo: 0,
        _id: 0,
        __v: 0,
        updatedAt: 0,
        organizationId: 0,
        createdBy: 0,
      },
    },
  ];

  const news = await News.aggregate(pipeline);

  return news[0] || { success: false, message: 'News not found' };
};
