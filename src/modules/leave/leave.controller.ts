import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { leaveService } from '.';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { employeeService } from '../employee';
import { rolesEnum } from '../../config/roles';
import { notificationServices } from '../notification';
import { userService } from '../user';
import { LeaveStatus } from './leave.interfaces';

export const createLeave = catchAsync(async (req: Request, res: Response) => {
  // Check if from date is greater than to date
  // if (new Date(req.body.startDate) > new Date(req.body.endDate)) {
  //   res.status(httpStatus.BAD_REQUEST).json({
  //     message: 'Start date cannot be greater than end date',
  //   });
  // }

  // Check if start date is less than current date
  // if (new Date(req.body.startDate) < new Date()) {
  //   res.status(httpStatus.BAD_REQUEST).json({
  //     message: 'Start date cannot be less than current date',
  //   });
  // }

  // Check if start date is more than 3 months
  // if(new Date(req.body.startDate) > new Date(new Date().setMonth(new Date().getMonth() + 3))) {
  //   res.status(httpStatus.BAD_REQUEST).json({
  //     message: 'Start date cannot be more than 3 months',
  //   });
  // }

  const leave = await leaveService.createLeave(req.body, req.user.id);
  const user = await userService.getUserById(req.user.id);
  const managerId = await employeeService.getEmployeeByUserId(req.user.id);
  if (req.user?.role === rolesEnum.employee) {
    await notificationServices.createLeaveRequestNotification(managerId!.managerId, user!.name, user?._id, leave._id);
  }
  res.status(httpStatus.CREATED).json({
    message: 'Leave created successfully',
    leave,
  });
});

export const updateLeave = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { leaveId } = req.params;
  if (typeof req.params['leaveId'] === 'string') {
    const leave = await leaveService.updateLeaveById(req.body, new mongoose.Types.ObjectId(leaveId), id);
    res.status(httpStatus.OK).json({
      message: 'Leave Updated Successfully',
      leave,
    });
  }
});

export const getMyOwnLeaves = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const leaves = await leaveService.getLeaveByEmployeeId(id);
  res.status(httpStatus.OK).json({
    message: 'Leaves fetched successfully',
    data: leaves,
  });
});

export const updateLeaveStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { leaveId } = req.body;

  const leave = await leaveService.updateLeaveStatus(req.body, new mongoose.Types.ObjectId(leaveId), id);
  if(leave.status === LeaveStatus.APPROVED) {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(leave?.employeeId as unknown as string));
    const managerInformation = await userService.getUserById(new mongoose.Types.ObjectId(id));
    await notificationServices.createLeaveApprovedNotification(user!.id, managerInformation!.name, managerInformation?.id, leave._id);
  }
  
  res.status(httpStatus.OK).json({
    message: 'Leave Updated Successfully',
    leave,
  });
});
