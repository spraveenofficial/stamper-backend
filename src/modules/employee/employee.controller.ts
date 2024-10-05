import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { userService } from '../user';
import { ApiError } from '../errors';
import { tokenService, tokenTypes } from '../token';
import { employeeService } from '.';
import { employeeAccountStatus } from './employee.interfaces';
import { DevelopmentOptions } from '../../config/roles';
import { emailService } from '../email';
import config from '../../config/config';
import mongoose from 'mongoose';

export const updateEmploeeAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const { body } = req;
  const { token } = req.query;
  const isTokenValid = await tokenService.verifyToken(token as string, tokenTypes.INVITATION);

  const employeeid = new mongoose.Types.ObjectId(isTokenValid.user);
  const user = await userService.getUserById(employeeid);
  
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found');
  }
  const updatePassword = await userService.updateUserById(user.id, body);
  await employeeService.updateEmployeeAccountStatus(user.id, employeeAccountStatus.Active);
  await tokenService.deleteToken(token as string);
  res.status(httpStatus.OK).json({ success: true, message: 'Employee account status updated successfully', updatePassword });
});

export const reinviteEmployee = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const { id } = req.user;
  const user = await userService.getUserByEmail(email);
  const manager = await userService.getUserById(id);

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found');
  }

  if (!manager) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found');
  }

  if (user.role !== 'employee') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is not an employee');
  }

  const employeeStatus = await employeeService.getEmployeeById(user.id);
  if (employeeStatus?.accountStatus === employeeAccountStatus.Active) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee account is already active');
  }

  const token = await tokenService.generateOrganizationInvitationToken(user);

  if (config.env == DevelopmentOptions.production) {
    await emailService.inviteEmployee(email, user?.name, manager?.name, token);
  }

  console.log('Token:', token);
  res.status(httpStatus.OK).json({ success: true, message: 'Employee re-invited successfully' });
});
