import mongoose from 'mongoose';
import { IJobTitleDoc, NewJobTitleType } from './jobTitles.interfaces';
import JobTitle from './jobTitles.model';
import { ApiError } from '../errors';

export const createJobTitle = async (
  jobTitleBody: NewJobTitleType,
  managerId: mongoose.Types.ObjectId,
  officeId: mongoose.Types.ObjectId,
  organizationId: mongoose.Types.ObjectId
): Promise<IJobTitleDoc> => {
  if (await JobTitle.isJobTitleExists(officeId, jobTitleBody.jobTitle)) {
    throw new ApiError(400, 'Job title already exists');
  }
  return await JobTitle.create({ ...jobTitleBody, managerId, officeId, organizationId });
};


export const getJobTitles = async (
  organizationId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10
): Promise<IJobTitleDoc[]> => {
  const skip = (page - 1) * limit;
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const jobTitles = await JobTitle.aggregate([
    { $match: { organizationId: orgId } },
    { $lookup: { from: 'departments', localField: 'departmentId', foreignField: '_id', as: 'department' } },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'managerId', foreignField: '_id', as: 'manager' } },
    { $unwind: { path: '$manager', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'offices', localField: 'officeId', foreignField: '_id', as: 'office' } },
    { $unwind: { path: '$office', preserveNullAndEmptyArrays: true } },
    { $addFields: { officeName: '$office.name', officeLocation: '$office.location' } },
    {
      $addFields: {
        jobTitleId: '$_id',
        departmentName: '$department.title',
        managerName: '$manager.name',
        managerEmail: '$manager.email',
      },
    },
    {
      $project: {
        departmentId: 0,
        organizationId: 0,
        officeId: 0,
        department: 0,
        managerId: 0,
        manager: 0,
        _id: 0,
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
        office:0,
      },
    },
    { $sort: { createdAt: -1 } },
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
  return jobTitles[0] || { success: true, data: { results: [] }, page, limit, totalPages: 0, totalResults: 0 };
}


export const getJobTitleById = async (jobTitleId: mongoose.Types.ObjectId): Promise<IJobTitleDoc | null> => {
  return await JobTitle.findById(jobTitleId);
}