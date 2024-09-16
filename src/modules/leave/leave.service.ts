import mongoose from 'mongoose';
import { ILeaveDoc, LeaveStatus, NewLeave } from './leave.interfaces';
import Leave from './leave.model';
import { ApiError } from '../errors';
import httpStatus from 'http-status';
import { organizationService } from '../organization';

/**
 * Create a leave
 * @param {NewLeave} leaveBody
 * @param {mongoose.Types.ObjectId} employeeId
 * @returns {Promise<any>}
 */

export const createLeave = async (leaveBody: NewLeave, employeeId: mongoose.Types.ObjectId): Promise<ILeaveDoc> => {
  if (await Leave.isLeaveExist(employeeId, leaveBody.startDate, leaveBody.endDate)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave already exist');
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
  return Leave.find({ employeeId }).select('-employeeId');
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
