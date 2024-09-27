import mongoose from 'mongoose';
import { IDepartment, IDepartmentDoc, NewDepartmentType } from './departments.interfaces';
import Department from './departments.model';
import { ApiError } from '../errors';

/**
 *
 * @param departmentBody
 * @param departmentHeadId
 * @param officeId
 * @param organizationId
 * @returns Promise<IDepartment>
 */
export const createDepartment = async (
  departmentBody: NewDepartmentType,
  departmentHeadId: mongoose.Types.ObjectId,
  officeId: mongoose.Types.ObjectId,
  organizationId: mongoose.Types.ObjectId
): Promise<IDepartmentDoc> => {
  if (await Department.isDepartmentExists(officeId, departmentBody.title)) {
    throw new ApiError(400, 'Department already exists');
  }
  return await Department.create({ ...departmentBody, departmentHeadId, officeId, organizationId });
};

/**
 *
 * @param organizationId
 * @param page
 * @param limit
 * @returns Promise<IDepartment[]>
 */
export const getDepartments = async (
  organizationId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10
): Promise<IDepartment[]> => {
  const skip = (page - 1) * limit;
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const departments = await Department.aggregate([
    { $match: { organizationId: orgId } },
    { $lookup: { from: 'users', localField: 'departmentHeadId', foreignField: '_id', as: 'departmentHead' } },
    { $unwind: { path: '$departmentHead', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'offices', localField: 'officeId', foreignField: '_id', as: 'office' } },
    { $unwind: { path: '$office', preserveNullAndEmptyArrays: true } },
    { $addFields: { officeName: '$office.name', officeLocation: '$office.location' } },
    {
      $addFields: {
        departmentId: '$_id',
        departmentHeadName: '$departmentHead.name',
        departmentHeadEmail: '$departmentHead.email',
      },
    },
    {
      $project: {
        departmentHead: 0,
        _id: 0,
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
        organizationId: 0,
        officeId: 0,
        departmentHeadId: 0,
        office: 0,
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

  return departments[0] || { success: true, data: { results: [] }, page, limit, totalPages: 0, totalResults: 0 };
};
