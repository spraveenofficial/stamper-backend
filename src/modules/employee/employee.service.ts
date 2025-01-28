import mongoose from 'mongoose';
import { rolesEnum } from '../../config/roles';
import { redisService } from '../redis/redis-service';
import { User } from '../user';
import { IUserDoc } from '../user/user.interfaces';
import { employeeAccountStatus, EmployeeStatus, employeeStatus, IEmployee, IEmployeeDoc } from './employee.interfaces';
import Employee from './employee.model';

export const addEmployee = async (employeeBody: any): Promise<IEmployeeDoc> => {
  return Employee.create(employeeBody);
};

export const getEmployeeById = async (id: mongoose.Types.ObjectId): Promise<IEmployee | null> => Employee.findById(id);

export const getEmployeeByUserId = async (userId: mongoose.Types.ObjectId): Promise<IEmployeeDoc | null> => {
  const redisQueryKey = `employeebyuserid:${userId}`;

  const isRedisDataExists = await redisService.get(redisQueryKey);

  if (isRedisDataExists) {
    return isRedisDataExists as IEmployeeDoc;
  }

  const response = await Employee.findOne({ userId });

  if (response !== null) await redisService.set(redisQueryKey, response, 3600);

  return response;
};

// Function to get employees by manager ID with modified response structure
export const getEmployeesByOrgId = async (
  orgId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10,
  officeId?: string | null,
  accountStatus?: employeeAccountStatus | null,
  employeeStatus?: EmployeeStatus | null,
  searchQuery?: string | null
): Promise<any> => {
  const skip = (page - 1) * limit;

  // Initialize match criteria with mandatory fields
  const matchCriteria: any = {
    organizationId: new mongoose.Types.ObjectId(orgId),
  };

  if (officeId) {
    matchCriteria.officeId = new mongoose.Types.ObjectId(officeId);
  }

  if (accountStatus) {
    matchCriteria.accountStatus = accountStatus;
  }

  if (employeeStatus) {
    matchCriteria.employeeStatus = employeeStatus;
  }

  // Handle searching by name or email
  if (searchQuery) {
    const userIds = await User.find({
      $or: [{ name: { $regex: searchQuery, $options: 'i' } }, { email: { $regex: searchQuery, $options: 'i' } }],
    })
      .select('_id -permissions')
      .lean()
      .exec();

    if (!userIds.length) {
      return {
        results: [],
        page,
        limit,
        totalResults: 0,
        totalPages: 0,
      };
    }

    matchCriteria.userId = { $in: userIds.map((user: IUserDoc) => new mongoose.Types.ObjectId(user._id)) };
  }

  // Define the aggregation pipeline
  const pipeline: any[] = [
    { $match: matchCriteria },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $lookup: {
        from: 'jobtitles',
        localField: 'jobTitleId',
        foreignField: '_id',
        as: 'jobTitleDetails',
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'departmentDetails',
      },
    },
    {
      $lookup: {
        from: 'offices',
        localField: 'officeId',
        foreignField: '_id',
        as: 'officeDetails',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'officeDetails.managerId',
        foreignField: '_id',
        as: 'managerDetails',
      },
    },
    { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$managerDetails', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$jobTitleDetails', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$departmentDetails', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$officeDetails', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        employeeId: '$userDetails._id',
        employeeName: '$userDetails.name',
        employeeEmail: '$userDetails.email',
        employeeProfilePicture: '$userDetails.profilePic',
        jobTitle: '$jobTitleDetails.jobTitle',
        joiningDate: '$joiningDate',
        department: '$departmentDetails.title',
        office: '$officeDetails.location',
        employeeStatus: '$employeeStatus',
        accountStatus: '$accountStatus',
        createdAt: '$createdAt',
        managerName: '$managerDetails.name',
        managerEmail: '$managerDetails.email',
      },
    },
    {
      $project: {
        _id: 0,
        officeDetails: 0,
        jobTitleId: 0,
        departmentId: 0,
        officeId: 0,
        organizationId: 0,
        userDetails: 0,
        managerDetails: 0,
        managerId: 0,
        updatedAt: 0,
        __v: 0,
        userId: 0,
        jobTitleDetails: 0,
        departmentDetails: 0,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const employees = await Employee.aggregate(pipeline);

  // Count total documents separately for pagination
  const totalCount = await Employee.countDocuments(matchCriteria);

  return {
    results: employees,
    page,
    limit,
    totalResults: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
};

/**
 * Function to update employee account status
 * @param {userId} string
 * @param {accountStatus} employeeAccountStatus
 * @returns {Promise<any>}
 */
export const updateEmployeeAccountStatus = async (userId: string, accountStatus: employeeAccountStatus): Promise<any> => {
  const employee = await Employee.findOneAndUpdate(
    { userId },
    {
      accountStatus,
      employeeStatus: employeeStatus.Active,
    },
    { new: true }
  );
  return employee;
};

export const getEmployeeByOfficeIdAndEmpId = async (
  officeId: mongoose.Types.ObjectId,
  empId: mongoose.Types.ObjectId
): Promise<IEmployeeDoc | null> => {
  return await Employee.findOne({ officeId, userId: empId });
};

export const searchEmployeeByNameAndEmail = async (
  organizationId: mongoose.Types.ObjectId,
  currentUserId: mongoose.Types.ObjectId,
  officeId?: mongoose.Types.ObjectId | null,
  page: number = 1,
  limit: number = 10,
  searchQuery?: string | null
): Promise<any> => {
  const skip = (page - 1) * limit;

  // Start with Users collection for text search
  const pipeline: any[] = [
    // First match users based on search query
    {
      $match: searchQuery
        ? {
          $or: [{ name: { $regex: searchQuery, $options: 'i' } }, { email: { $regex: searchQuery, $options: 'i' } }],
        }
        : {},
    },
    // Look up matching employees
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: 'userId',
        pipeline: [
          {
            $match: {
              organizationId: new mongoose.Types.ObjectId(organizationId),
              ...(officeId && { officeId: new mongoose.Types.ObjectId(officeId) }),
            },
          },
        ],
        as: 'employeeDetails',
      },
    },
    // Filter out users who aren't employees in the organization
    {
      $match: {
        employeeDetails: { $ne: [{ userId: currentUserId }] },
      },
    },
    // Unwind the employee details
    {
      $unwind: '$employeeDetails',
    },
    // Shape the final output
    {
      $project: {
        id: '$_id',
        name: '$name',
        email: '$email',
        profilePic: '$profilePic',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    // Pagination
    { $skip: skip },
    { $limit: limit },
  ];

  // Execute the main query
  const employees = await User.aggregate(pipeline);

  // Count total results with the same criteria but without pagination
  const countPipeline = [...pipeline];
  countPipeline.splice(-2); // Remove skip and limit stages
  const [{ count: totalCount } = { count: 0 }] = await User.aggregate([...countPipeline, { $count: 'count' }]);

  return {
    results: employees,
    page,
    limit,
    totalResults: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
};

export const getEmployeesByOrgIdWithoutLimit = async (
  orgId: mongoose.Types.ObjectId,
  officeId?: string | null,
  accountStatus?: employeeAccountStatus | null,
  employeeStatus?: EmployeeStatus | null,
  targetRole?: rolesEnum | null
): Promise<any> => {
  let userMatchCriteria: any = {};

  const matchCriteria: any = {
    organizationId: new mongoose.Types.ObjectId(orgId), // Match employees with the given organizationId
  };

  if (officeId) {
    matchCriteria.officeId = new mongoose.Types.ObjectId(officeId);
  }

  if (accountStatus) {
    matchCriteria.accountStatus = accountStatus;
  }

  if (employeeStatus) {
    matchCriteria.employeeStatus = employeeStatus;
  }

  if (targetRole) {
    userMatchCriteria.role = targetRole;
  }

  const pipeline: any[] = [
    {
      $match: { ...matchCriteria }, // Stage 1: Match employees with the given organizationId
    },
    {
      $lookup: {
        from: 'users', // Collection to join with
        localField: 'userId', // Field from the Employee collection
        foreignField: '_id', // Field from the User collection
        as: 'userDetails', // Output array field
      },
    },
    {
      $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }, // Unwind the userDetails array
    },
    {
      $addFields: {
        employeeId: '$userDetails._id',
        employeeName: '$userDetails.name',
        employeeEmail: '$userDetails.email',
        employeeProfilePicture: '$userDetails.profilePic',
        jobTitleId: '$jobTitleId',
        joiningDate: '$joiningDate',
        departmentId: '$departmentId',
        officeId: '$officeId',
        employeeStatus: '$employeeStatus',
        accountStatus: '$accountStatus',
        createdAt: '$createdAt',
      },
    },
    {
      $project: {
        userDetails: 0, // Exclude the original userDetails field
        _id: 0, // Exclude _id field
        updatedAt: 0, // Exclude updatedAt field
        __v: 0, // Exclude __v field
        userId: 0, // Exclude userId field
      },
    },
  ];

  const employees = await Employee.aggregate(pipeline);

  return employees;
};

export const getEmployeeInformation = async (userId: mongoose.Types.ObjectId): Promise<any> => {
  const pipeline = [
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'jobtitles',
        localField: 'jobTitleId',
        foreignField: '_id',
        as: 'jobTitleDetails',
      },
    },
    {
      $unwind: { path: '$jobTitleDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'departmentDetails',
      },
    },
    {
      $unwind: { path: '$departmentDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'offices',
        localField: 'officeId',
        foreignField: '_id',
        as: 'officeDetails',
      },
    },
    {
      $unwind: { path: '$officeDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'userpersonalinfos',
        localField: 'userId',
        foreignField: 'userId',
        as: 'personalInfo',
      },
    },
    {
      $unwind: { path: '$personalInfo', preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: {
        userInformation: {
          id: '$userDetails._id',
          name: '$userDetails.name',
          email: '$userDetails.email',
          profilePic: '$userDetails.profilePic',
          lastUpdatedAt: '$userDetails.updatedAt',
          phoneNumber: {
            $cond: {
              if: { $eq: ['$userDetails.phoneNumber', ''] },
              then: null,
              else: '$userDetails.phoneNumber',
            },
          },
        },
        officeInformation: {
          officeId: '$officeDetails._id',
          name: '$officeDetails.name',
          location: '$officeDetails.location',
        },
        departmentInformation: {
          departmentId: '$departmentDetails._id',
          title: '$departmentDetails.title',
        },
        jobTitle: '$jobTitleDetails.jobTitle',
        joiningDate: '$joiningDate',
        department: '$departmentDetails.title',
        office: '$officeDetails.location',
        employeeStatus: '$employeeStatus',
        accountStatus: '$accountStatus',
        createdAt: '$createdAt',
        personalInfo: {
          userTimezone: { $ifNull: ['$personalInfo.userTimezone', 'UTC+00:00'] },
          gender: { $ifNull: ['$personalInfo.gender', null] },
          maritalStatus: { $ifNull: ['$personalInfo.maritalStatus', null] },
          personalEmail: { $ifNull: ['$personalInfo.personalEmail', null] },
          dateOfBirth: { $ifNull: ['$personalInfo.dateOfBirth', null] },
          address: { $ifNull: ['$personalInfo.address', null] },
          country: { $ifNull: ['$personalInfo.country', null] },
          state: { $ifNull: ['$personalInfo.state', null] },
          city: { $ifNull: ['$personalInfo.city', null] },
          zipCode: { $ifNull: ['$personalInfo.zipCode', null] },
          nationality: { $ifNull: ['$personalInfo.nationality', null] },
          personalTaxId: { $ifNull: ['$personalInfo.personalTaxId', null] },
          emergencyContactDetails: {
            $ifNull: ['$personalInfo.emergencyContactDetails', []],
          },
          bankAccountDetails: {
            $ifNull: ['$personalInfo.bankAccountDetails', []],
          },
        },
      },
    },
    {
      $project: {
        userDetails: 0,
        jobTitleId: 0,
        departmentId: 0,
        officeId: 0,
        organizationId: 0,
        _id: 0,
        updatedAt: 0,
        __v: 0,
        userId: 0,
        jobTitleDetails: 0,
        departmentDetails: 0,
        officeDetails: 0,
        'personalInfo._id': 0, // Exclude _id from personalInfo
        'personalInfo.__v': 0, // Exclude __v from personalInfo
        'personalInfo.userId': 0, // Exclude userId from personalInfo
      },
    },
  ];

  const employee = await Employee.aggregate(pipeline);
  return employee.length ? employee[0] : null;
};
