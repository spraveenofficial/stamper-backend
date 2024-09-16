import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { leaveService } from '.';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

export const createLeave = catchAsync(async (req: Request, res: Response) => {
  const leave = await leaveService.createLeave(req.body, req.user.id);
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
  res.status(httpStatus.OK).json({
    message: 'Leave Updated Successfully',
    leave,
  });
});
