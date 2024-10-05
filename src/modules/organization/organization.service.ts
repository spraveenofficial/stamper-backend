import httpStatus from 'http-status';
import { ApiError } from '../errors';
import Organization from './organization.model';
import mongoose from 'mongoose';
import { IOrganization, IOrganizationDoc } from './organization.interfaces';
import { Employee } from '../employee';
import { Office } from '../office';

/**
 * Update user by id
 * @param {UpdateUserBody} updateBody
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IOrganizationDoc  | null>}
 */

export const createOrganization = async (
  organizationBody: IOrganization,
  userId: mongoose.Types.ObjectId
): Promise<IOrganizationDoc> => {
  if (await Organization.isOrganizationExist(new mongoose.Types.ObjectId(userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Organization already exist');
  }
  if (await Organization.isOrganizationDomainNameTaken(organizationBody.companyDomainName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Company domain name already taken');
  }

  const organization = await Organization.create({ ...organizationBody, userId });
  return organization;
};

/**
 * Get organization by user id
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IOrganizationDoc>}
 * */

export const getOrganizationByUserId = async (userId: mongoose.Types.ObjectId): Promise<IOrganizationDoc | null> => {
  return Organization.findOne({
    userId: userId,
  });
};

/**
 * Check if employee and manager are in same organization
 * @param {mongoose.Types.ObjectId} employeeId
 * @param {mongoose.Types.ObjectId} managerId
 * @returns {Promise<boolean>}
 * */
export const isEmployeeAndManagerInSameOrganization = async (
  employeeId: string,
  managerId: mongoose.Types.ObjectId
): Promise<boolean> => {
  const organization = await Employee.findOne({
    userId: employeeId,
  });

  if (!organization) {
    return false;
  }
  // Compare the ObjectId values as strings
  return managerId.toString() === organization.managerId.toString();
};

export const getOrgChartById = async (orgId: mongoose.Types.ObjectId): Promise<any> => {
  const organizationId = new mongoose.Types.ObjectId(orgId);
  const orgChart = await Office.aggregate([
    {
      $match: {
        organizationId: organizationId,
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: 'officeId',
        as: 'departments',
      },
    },
    {
      $unwind: {
        path: '$departments',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'jobtitles',
        localField: 'departments._id',
        foreignField: 'departmentId',
        as: 'departments.jobTitles',
      },
    },
    {
      $group: {
        _id: '$_id', // Group by office ID
        name: { $first: '$name' }, // Office name
        location: { $first: '$location' }, // Any other office fields
        children: {
          $push: {
            id: '$departments._id', // Department ID
            name: '$departments.title', // Department name
            children: {
              $map: {
                input: '$departments.jobTitles',
                as: 'jobTitle',
                in: {
                  id: '$$jobTitle._id',
                  name: '$$jobTitle.jobTitle',
                },
              },
            },
          },
        },
      },
    },
    {
      // Filter out departments where `children` (jobTitles) is empty
      $project: {
        _id: 1,
        name: 1,
        location: 1,
        children: {
          $filter: {
            input: '$children',
            as: 'department',
            cond: {
              $and: [
                { $ne: ['$$department.id', null] },
                { $gt: [{ $size: '$$department.children' }, 0] }, // Only include departments with jobTitles (children) > 0
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        id: '$_id',
        name: 1,
        location: 1,
        children: 1, // Departments are now children, with jobTitles nested as children within departments
        _id: 0,
      },
    },
  ]);
  
  

  return orgChart;
};
