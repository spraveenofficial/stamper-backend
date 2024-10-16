import mongoose from 'mongoose';
import { ILeaveDoc, LeaveStatus, NewLeave } from './leave.interfaces';
import Leave from './leave.model';
import { ApiError } from '../errors';
import httpStatus from 'http-status';
import { organizationService } from '../organization';
import { s3Services } from '../s3';

/**
 * Create a leave
 * @param {NewLeave} leaveBody
 * @param {mongoose.Types.ObjectId} employeeId
 * @returns {Promise<any>}
 */

export const createLeave = async (
  leaveBody: NewLeave,
  employeeId: mongoose.Types.ObjectId,
  attachment?: Express.Multer.File
): Promise<ILeaveDoc> => {
  if (await Leave.isLeaveExist(employeeId, leaveBody.startDate, leaveBody.endDate)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave already exist');
  }
  if (attachment) {
    const fileUrl = await s3Services.uploadLeaveRequestFile(attachment, employeeId.toString());
    leaveBody.attachment = fileUrl;
  }
  return Leave.create({ ...leaveBody, employeeId: employeeId });
};

/**
 * Get leave by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ILeaveDoc | null>}
 * */

export const getLeaveById = async (id: mongoose.Types.ObjectId): Promise<ILeaveDoc | null> => Leave.findById(id);

/**
 * Get leave by employee id
 * @param {mongoose.Types.ObjectId} employeeId
 * @returns {Promise<ILeaveDoc[]>}
 * */
export const getLeaveByEmployeeId = async (employeeId: mongoose.Types.ObjectId): Promise<ILeaveDoc[]> => {
  const pipeline = [
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId), // Match the specific employeeId
      },
    },
    {
      $lookup: {
        from: 'leavetypes', // The collection name for LeaveType
        localField: 'leaveTypeId', // Field in Leave document
        foreignField: '_id', // Field in LeaveType document
        as: 'leaveType', // The field name in the output for the populated field
      },
    },
    {
      $unwind: {
        path: '$leaveType', // Flatten the array created by $lookup
        preserveNullAndEmptyArrays: true, // Keep documents even if no leaveType is found
      },
    },
    {
      $project: {
        id: '$_id', // Rename _id to id
        _id: 0, // Exclude the original _id field
        startDate: 1, // Include other necessary fields
        endDate: 1,
        status: 1,
        total: 1,
        note: 1,
        leaveType: '$leaveType.leaveType', // Rename leaveTypeId.leaveType to leaveType in the final output
        leaveTypeId: '$leaveType._id', // Rename leaveTypeId._id to leaveTypeId in the final output
      },
    },
  ];

  // Use 'as' or cast to resolve type mismatch
  const result = await Leave.aggregate(pipeline).exec() as ILeaveDoc[];

  return result;
};



/**
 * Update leave by id
 * @param {NewLeave} leaveBody
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<ILeaveDoc | null>}
 * */

export const updateLeaveById = async (
  leaveBody: NewLeave,
  leaveId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<ILeaveDoc | null> => {
  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave not found');
  }

  //   Check if leave is already approved
  if (leave.status === LeaveStatus.APPROVED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave Already Approved');
  }
  // Check if user is editing his own leave
  if (leave.employeeId.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized to edit this leave');
  }
  Object.assign(leave, leaveBody);
  await leave.save();
  return leave;
};

export const updateLeaveStatus = async (
  leaveBody: NewLeave,
  leaveId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<ILeaveDoc> => {
  const leave = await Leave.findById(leaveId);

  if (!leave) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave not found');
  }
  // Check if leave is already approved
  if (leave.status === LeaveStatus.APPROVED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave Already Approved');
  }
  // Find employee manager
  const employeeManager = await organizationService.isEmployeeAndManagerInSameOrganization(
    leave.employeeId.toString(),
    userId
  );
  if (!employeeManager) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized to update this leave');
  }

  Object.assign(leave, leaveBody);
  await leave.save();
  return leave;
};
