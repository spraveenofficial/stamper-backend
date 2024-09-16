import httpStatus from 'http-status';
import { ApiError } from '../errors';
import Organization from './organization.model';
import mongoose from 'mongoose';
import { IOrganization, IOrganizationDoc } from './organization.interfaces';
import { Employee } from '../employee';

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
  if(await Organization.isOrganizationExist(new mongoose.Types.ObjectId(userId))) {
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
  })
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
