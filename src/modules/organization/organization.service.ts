import httpStatus from 'http-status';
import { ApiError } from '../errors';
import Organization from './organization.model';
import mongoose from 'mongoose';
import { IOrganization, IOrganizationDoc } from './organization.interfaces';
import { Office } from '../office';
import { Department } from '../departments';
import { JobTitle } from '../jobTitles';
import { FLOW_CONSTANTS } from '../../constants/flow_constansts';

export const getOrganizationById = async (id: mongoose.Types.ObjectId): Promise<IOrganizationDoc | null> => {
  return await Organization.findById(id);
};

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
  const office = await Office.findOne({ managerId: managerId });
  if (!office) {
    return false;
  }
  // Compare the ObjectId values as strings
  return managerId.toString() === employeeId.toString();
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

export const getOrgConfig = async (orgId: mongoose.Types.ObjectId, officeId?: mongoose.Types.ObjectId): Promise<any> => {
  const organizationId = new mongoose.Types.ObjectId(orgId);

  const matchFilter: any = {
    organizationId: organizationId,
  };

  if (officeId) {
    matchFilter['_id'] = officeId;
  }
  
  const organizationConfig = await Office.aggregate([
    {
      $match: matchFilter,
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
        departments: {
          $push: {
            id: '$departments._id', // Department ID
            name: '$departments.title', // Department name
            jobtitles: {
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
      $project: {
        id: '$_id', // Retain id field from _id
        name: 1,
        location: 1,
        departments: 1,
      },
    },
    {
      $project: {
        _id: 0, // Exclude _id from the final output
        id: 1, // Include the id field
        name: 1,
        location: 1,
        departments: 1,
      },
    },
  ]);

  return organizationConfig;
};

export const getOrgEmployeeOnBoardingFlow = (organizationId: mongoose.Types.ObjectId, isOrgAdded: boolean): Promise<any> => {
  // Initialize flow status
  const flowStatus = {
    flowName: FLOW_CONSTANTS.EMPLOYEE_ONBOARDING,
    hasOrganization: isOrgAdded,
    hasOffice: false,
    hasDepartment: false,
    hasJobTitle: false,
    currentStep: isOrgAdded ? 'office' : null, // Start checking at 'office' only if organization is added
    message: isOrgAdded ? 'Please add an office to continue.' : 'Please add an organization to continue.',
    totalSteps: 4, // Total steps include organization, office, department, and job title
    completedSteps: 0,
  };

  // If organization is not added, return flow status indicating the need to add an organization
  if (!isOrgAdded) {
    return Promise.resolve(flowStatus); // Return flow status with message to add organization
  }

  // Check for office existence
  return Office.exists({ organizationId })
    .then((officeExists) => {
      if (officeExists) {
        flowStatus.hasOffice = true;
        flowStatus.currentStep = 'department';
        flowStatus.message = 'Please add a department to continue.';
      }
      return Department.exists({ organizationId });
    })
    .then((departmentExists) => {
      if (departmentExists) {
        flowStatus.hasDepartment = true;
        flowStatus.currentStep = 'jobTitle';
        flowStatus.message = 'Please add a job title to continue.';
      }
      return JobTitle.exists({ organizationId });
    })
    .then((jobTitleExists) => {
      if (jobTitleExists) {
        flowStatus.hasJobTitle = true;
        flowStatus.currentStep = 'complete';
        flowStatus.message = 'You are ready to add an employee.';
      }

      // Calculate completed steps
      flowStatus.completedSteps = [
        flowStatus.hasOrganization,
        flowStatus.hasOffice,
        flowStatus.hasDepartment,
        flowStatus.hasJobTitle,
      ].filter(Boolean).length;

      // Return null if all steps are completed
      return flowStatus.completedSteps === flowStatus.totalSteps ? null : flowStatus;
    })
    .catch((error) => {
      throw new Error('Error checking preconditions: ' + error.message);
    });
};
