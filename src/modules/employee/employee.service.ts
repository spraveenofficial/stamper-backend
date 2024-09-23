import mongoose from 'mongoose';
import { employeeAccountStatus, IEmployee, IEmployeeDoc, NewEmployee } from './employee.interfaces';
import Employee from './employee.model';

export const addEmployee = async (employeeBody: NewEmployee): Promise<any> => {
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
  page: number = 1, // Default page number
  limit: number = 10 // Default limit
): Promise<any> => {
  const managerID = new mongoose.Types.ObjectId(managerId);

  // Calculate skip and limit
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
      $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }, // Unwind the userDetails array
    },
    {
      $addFields: {
        employeeId: '$userDetails._id',
        employeeName: '$userDetails.name',
        employeeEmail: '$userDetails.email',
        jobTitle: '$jobTitle',
        joiningDate: '$joiningDate',
        department: '$department',
        office: '$office',
        employeeStatus: '$employeeStatus',
        accountStatus: '$accountStatus',
        createdAt: '$createdAt',
        // Exclude original userDetails
      },
    },
    {
      $project: {
        userDetails: 0, // Exclude the original userDetails field
        managerId: 0, // Exclude managerId field
        _id: 0, // Exclude _id field
        updatedAt: 0, // Exclude updatedAt field
        __v: 0, // Exclude __v field
        userId: 0, // Exclude userId field
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
