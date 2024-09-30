import mongoose from 'mongoose';
import { employeeAccountStatus, IEmployee, IEmployeeDoc } from './employee.interfaces';
import Employee from './employee.model';

export const addEmployee = async (employeeBody: IEmployee): Promise<IEmployeeDoc> => {
  // if (await Employee.isEmployeeExist(employeeBody.userId)) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, 'Employee already exist');
  // }
  return Employee.create(employeeBody);
};

export const getEmployeeById = async (id: string): Promise<IEmployee | null> => Employee.findById(id);

export const getEmployeeByUserId = async (userId: string): Promise<IEmployeeDoc | null> => Employee.findOne({ userId });

// Function to get employees by manager ID with modified response structure
export const getEmployeesByManagerId = async (
  managerId: string,
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  const managerID = new mongoose.Types.ObjectId(managerId);

  const skip = (page - 1) * limit;

  const employees = await Employee.aggregate([
    {
      $match: { managerId: managerID }, // Stage 1: Match employees with the given managerId
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
      }
    },
    {
      $lookup: {
         from: 'jobtitles', // Collection to join with
          localField: 'jobTitleId', // Field from the Employee collection
          foreignField: '_id', // Field from the JobTitle collection
          as: 'jobTitleDetails', // Output array field
      }
    },
    {
      $lookup: {
        from: 'departments', // Collection to join with
        localField: 'departmentId', // Field from the Employee collection
        foreignField: '_id', // Field from the Department collection
        as: 'departmentDetails', // Output array field
      }
    },
    {
      $lookup:{
        from: 'offices', // Collection to join with
        localField: 'officeId', // Field from the Employee collection
        foreignField: '_id', // Field from the Office collection
        as: 'officeDetails', // Output array field
      }
    },
    {
      $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }, // Unwind the userDetails array
    },
    {
      $unwind: { path: '$managerDetails', preserveNullAndEmptyArrays: true }, // Unwind the managerDetails array
    },
    {
      $unwind: {path: '$jobTitleDetails', preserveNullAndEmptyArrays: true}, // Unwind the jobTitleDetails array
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
          { $addFields: { page, limit } } // Include page and limit in metadata
        ],
        data: [
          { $skip: skip }, // Skip for pagination
          { $limit: limit }, // Limit the number of results
        ],
      },
    },
    {
      $unwind: '$metadata' // Unwind the metadata array
    },
    {
      $project: {
        results: '$data', // Include data field
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', limit] } // Calculate totalPages
        },
        totalResults: '$metadata.totalCount',
      },
    },
  ]);

  return employees[0] || { data: {results: []}, page, limit, totalPages: 0, totalResults: 0 }; // Return formatted response
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
    },
    { new: true }
  );
  return employee;
};
