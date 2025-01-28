import httpStatus from 'http-status';
import mongoose, { PipelineStage } from 'mongoose';
import { FLOW_CONSTANTS } from '../../constants/flow_constansts';
import { Department } from '../departments';
import { ApiError } from '../errors';
import { JobTitle } from '../jobTitles';
import { Office } from '../office';
import { redisService } from '../redis/redis-service';
import { IOrganization, IOrganizationDoc } from './organization.interfaces';
import Organization from './organization.model';

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
  const redisQueryKey = `organizationbyuser:${userId}`;

  const redisQueryResult = await redisService.get(redisQueryKey);

  if (redisQueryResult) {
    return redisQueryResult as IOrganizationDoc;
  }

  const result = await Organization.findOne({
    userId: userId,
  });

  if (result !== null) await redisService.set(redisQueryKey, result, 3600);

  return result
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
  return managerId.toString() === employeeId.toString();
};

export const getOrgChartById = async (orgId: mongoose.Types.ObjectId): Promise<any> => {
  const organizationId = new mongoose.Types.ObjectId(orgId);

  const pipeline: PipelineStage[] = [
    // Match offices by organizationId
    {
      $match: {
        organizationId: organizationId,
      },
    },
    // Lookup departments for each office
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: 'officeId',
        as: 'departments',
      },
    },
    // Unwind departments (optional to handle individual department-level processing)
    {
      $unwind: {
        path: '$departments',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup job titles for each department
    {
      $lookup: {
        from: 'jobtitles',
        localField: 'departments._id',
        foreignField: 'departmentId',
        as: 'departments.jobTitles',
      },
    },
    // Group by office to aggregate departments
    {
      $group: {
        _id: '$_id', // Office ID
        name: { $first: '$name' }, // Office name
        location: { $first: '$location' }, // Office location
        organizationId: { $first: '$organizationId' }, // Organization ID
        departments: {
          $push: {
            id: '$departments._id',
            name: '$departments.title',
            children: {
              $ifNull: [
                {
                  $map: {
                    input: '$departments.jobTitles',
                    as: 'jobTitle',
                    in: {
                      id: '$$jobTitle._id',
                      name: '$$jobTitle.jobTitle',
                    },
                  },
                },
                [],
              ],
            },
          },
        },
      },
    },
    // Lookup organization details
    {
      $lookup: {
        from: 'organizations',
        localField: 'organizationId',
        foreignField: '_id',
        as: 'organization',
      },
    },
    // Unwind organization to simplify access
    {
      $unwind: {
        path: '$organization',
        preserveNullAndEmptyArrays: false, // Organization must exist
      },
    },
    // Group everything under the organization
    {
      $group: {
        _id: '$organization._id', // Organization ID
        name: { $first: '$organization.companyName' }, // Organization name
        children: {
          $push: {
            id: '$_id',
            name: '$name',
            location: '$location',
            children: '$departments', // Nested departments with job titles
          },
        },
      },
    },
    // Final projection
    {
      $project: {
        id: '$_id', // Organization ID
        name: 1, // Organization name
        children: 1, // Nested offices with departments and job titles
        _id: 0,
      },
    },
  ]

  const orgChart = await Office.aggregate(pipeline);

  return orgChart;
};

export const getOrgConfig = async (
  orgId: mongoose.Types.ObjectId,
  officeId?: mongoose.Types.ObjectId
): Promise<any> => {
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
        _id: '$_id',
        name: { $first: '$name' },
        location: { $first: '$location' },
        departments: {
          $push: {
            $cond: {
              if: { $and: [{ $ifNull: ['$departments._id', false] }, { $ifNull: ['$departments.title', false] }] }, // Check if department has both ID and title
              then: {
                id: '$departments._id', // Department ID
                name: '$departments.title', // Department name
                jobtitles: {
                  $cond: {
                    if: { $or: [{ $eq: ['$departments.jobTitles', null] }, { $eq: [{ $size: '$departments.jobTitles' }, 0] }] }, // Check for missing or empty jobTitles
                    then: [], // Empty array if no jobTitles
                    else: {
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
              else: null, // Exclude invalid departments
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
        departments: {
          $filter: {
            input: '$departments',
            as: 'department',
            cond: { $ne: ['$$department', null] }, // Remove null departments
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: 1,
        name: 1,
        location: 1,
        departments: 1,
      },
    },
  ]);

  return organizationConfig
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

export const getOrgOfficeNDepartmentNJobTitle = async (
  orgId: mongoose.Types.ObjectId,
  officeId?: mongoose.Types.ObjectId
): Promise<any> => {
  let filter: any = {
    organizationId: new mongoose.Types.ObjectId(orgId),
  };

  if (officeId) {
    filter['_id'] = officeId;
  }

  const orgChart = await Office.aggregate([
    {
      $match: filter,
    },
    // Lookup departments for each office
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: 'officeId',
        as: 'departments',
      },
    },
    // Unwind departments to access individual department data
    {
      $unwind: {
        path: '$departments',
        preserveNullAndEmptyArrays: true, // Handle offices with no departments
      },
    },
    // Lookup job titles for each department
    {
      $lookup: {
        from: 'jobtitles',
        localField: 'departments._id',
        foreignField: 'departmentId',
        as: 'jobTitles',
      },
    },
    // Unwind job titles to access individual job title data
    {
      $unwind: {
        path: '$jobTitles',
        preserveNullAndEmptyArrays: true, // Handle departments with no job titles
      },
    },
    // Group data to collect all offices, departments, and job titles
    {
      $group: {
        _id: null, // No grouping by office here; collect everything globally
        offices: { $addToSet: '$name' }, // Collect unique office names
        departments: { $addToSet: '$departments.title' }, // Collect unique department names
        jobtitles: { $addToSet: '$jobTitles.jobTitle' }, // Collect unique job titles
      },
    },
    // Final cleanup to project the result
    {
      $project: {
        _id: 0,
        offices: 1,
        departments: 1,
        jobtitles: 1,
      },
    },
  ]);

  return orgChart.length ? orgChart[0] : { offices: [], departments: [], jobtitles: [] };
};
