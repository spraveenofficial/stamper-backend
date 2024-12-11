import mongoose from 'mongoose';
import { IDepartment, IDepartmentDoc, NewDepartmentType, UpdateDepartmentType } from './departments.interfaces';
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
  officeId: mongoose.Types.ObjectId
): Promise<IDepartment[]> => {
  let filter: any = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
    officeId: new mongoose.Types.ObjectId(officeId),
  };

  const departments = await Department.aggregate([
    { $match: filter },
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
  ]);

  return departments;
};

export const getDeparmentById = async (departmentId: mongoose.Types.ObjectId): Promise<IDepartmentDoc | null> => {
  return await Department.findById(departmentId);
};

/**
 *
 * @param departmentId
 * @param departmentBody
 * @returns Promise<IDepartment>
 */
export const editDepartment = async (departmentId: mongoose.Types.ObjectId, departmentBody: UpdateDepartmentType) => {
  const department = await Department.findById(departmentId);

  if (!department) {
    throw new ApiError(400, 'Department not found');
  }

  if (departmentBody.title) {
    if (await Department.isDepartmentExists(department.officeId, departmentBody.title)) {
      throw new ApiError(400, 'Department already exists');
    }
  }
  
  return await Department.findByIdAndUpdate(departmentId, departmentBody, { new: true });
};
