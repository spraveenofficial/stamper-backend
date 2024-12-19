import mongoose from 'mongoose';
import { employeeAccountStatus, IEmployee, IEmployeeDoc, EmployeeStatus, employeeStatus } from './employee.interfaces';
import Employee from './employee.model';
import { rolesEnum } from '../../config/roles';

export const addEmployee = async (employeeBody: any): Promise<IEmployeeDoc> => {
  return Employee.create(employeeBody);
};

export const addEmployeesBulk = async (employees: any[]): Promise<any[]> => {
  return Employee.insertMany(employees);
};
export const getEmployeeById = async (id: mongoose.Types.ObjectId): Promise<IEmployee | null> => Employee.findById(id);

export const getEmployeeByUserId = async (userId: mongoose.Types.ObjectId): Promise<IEmployeeDoc | null> => {
  return await Employee.findOne({ userId });
};

// Function to get employees by manager ID with modified response structure
export const getEmployeesByOrgId = async (
  orgId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10,
  officeId?: string | null,
  accountStatus?: employeeAccountStatus | null,
  employeeStatus?: EmployeeStatus | null,
  employeeName?: string | null
): Promise<any> => {
  const skip = (page - 1) * limit;

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

  // Pre-filter employees by name using $lookup
  const nameFilterLookup: any[] = employeeName
    ? [
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            pipeline: [
              {
                $match: {
                  name: { $regex: employeeName, $options: 'i' },
                },
              },
            ],
            as: 'filteredUserDetails',
          },
        },
        {
          $match: { filteredUserDetails: { $ne: [] } },
        },
        {
          $unset: 'filteredUserDetails',
        },
      ]
    : [];

  const pipeline: any[] = [
    { $match: matchCriteria },
    ...nameFilterLookup,
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
    {
      $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $unwind: { path: '$managerDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $unwind: { path: '$jobTitleDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $unwind: { path: '$departmentDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $unwind: { path: '$officeDetails', preserveNullAndEmptyArrays: true },
    },
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
    {
      $facet: {
        metadata: [{ $count: 'totalCount' }, { $addFields: { page, limit } }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
    {
      $unwind: '$metadata',
    },
    {
      $project: {
        results: '$data',
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', limit] },
        },
        totalResults: '$metadata.totalCount',
      },
    },
  ];

  const employees = await Employee.aggregate(pipeline);

  return employees.length ? employees[0] : { results: [], page: 1, limit, totalResults: 0, totalPages: 0 };
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

/**
 *
 * @param officeId
 * @param page
 * @param limit
 * @returns
 */
export const getEmployeesByOfficeId = async (officeId: string, page: number = 1, limit: number = 10): Promise<any> => {
  const skip = (page - 1) * limit;

  const employees = await Employee.aggregate([
    {
      $match: { officeId: new mongoose.Types.ObjectId(officeId) }, // Stage 1: Match employees with the given managerId
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
      $lookup: {
        from: 'users', // Collection to join with
        localField: 'managerId', // Field from the Employee collection
        foreignField: '_id', // Field from the User collection
        as: 'managerDetails', // Output array field
      },
    },
    {
      $lookup: {
        from: 'jobtitles', // Collection to join with
        localField: 'jobTitleId', // Field from the Employee collection
        foreignField: '_id', // Field from the JobTitle collection
        as: 'jobTitleDetails', // Output array field
      },
    },
    {
      $lookup: {
        from: 'departments', // Collection to join with
        localField: 'departmentId', // Field from the Employee collection
        foreignField: '_id', // Field from the Department collection
        as: 'departmentDetails', // Output array field
      },
    },
    {
      $lookup: {
        from: 'offices', // Collection to join with
        localField: 'officeId', // Field from the Employee collection
        foreignField: '_id', // Field from the Office collection
        as: 'officeDetails', // Output array field
      },
    },
    {
      $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }, // Unwind the userDetails array
    },
    {
      $unwind: { path: '$managerDetails', preserveNullAndEmptyArrays: true }, // Unwind the managerDetails array
    },
    {
      $unwind: { path: '$jobTitleDetails', preserveNullAndEmptyArrays: true }, // Unwind the jobTitleDetails array
    },
    {
      $unwind: { path: '$departmentDetails', preserveNullAndEmptyArrays: true }, // Unwind the departmentDetails array
    },
    {
      $unwind: { path: '$officeDetails', preserveNullAndEmptyArrays: true }, // Unwind the officeDetails array
    },
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
        officeDetails: 0, // Exclude the original officeDetails field
        jobTitleId: 0, // Exclude the original jobTitleId field
        deparmentId: 0, // Exclude the original departmentId field
        officeId: 0, // Exclude the original officeId field
        organizationId: 0, // Exclude the original organizationId field
        userDetails: 0, // Exclude the original userDetails field
        managerDetails: 0, // Exclude the original managerDetails field
        managerId: 0, // Exclude managerId field
        _id: 0, // Exclude _id field
        updatedAt: 0, // Exclude updatedAt field
        __v: 0, // Exclude __v field
        userId: 0, // Exclude userId field
        jobTitleDetails: 0, // Exclude jobTitleDetails field
        departmentDetails: 0,
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
        results: '$data', // Include data field
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', limit] }, // Calculate totalPages
        },
        totalResults: '$metadata.totalCount',
      },
    },
  ]);

  return employees.length ? employees[0] : { results: [], page: 1, limit, totalResults: 0, totalPages: 0 }; // Return formatted response
};

export const getEmployeeByOfficeIdAndEmpId = async (
  officeId: mongoose.Types.ObjectId,
  empId: mongoose.Types.ObjectId
): Promise<IEmployeeDoc | null> => {
  return await Employee.findOne({ officeId, userId: empId });
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
          userTimezone: { $ifNull: ['$personalInfo.userTimezone', 'UTC'] },
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
