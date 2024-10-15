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
// import { organizationService } from '../organization';
import { excelServices } from '../common/services/excel-service';

export const updateEmploeeAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const { body } = req;
  const { token } = req.query;
  const isTokenValid = await tokenService.verifyToken(token as string, tokenTypes.INVITATION);

  if (!isTokenValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Token');
  }

  const employeeid = new mongoose.Types.ObjectId(isTokenValid.user);
  const user = await userService.getUserById(employeeid);

  
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found');
  }
  
  const token_for = await tokenService.generateOrganizationInvitationToken(user);
  console.log('Token:', token_for);
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

export const generateBulkUploadEmployeeExcelExample = catchAsync(async (_req: Request, res: Response) => {
  // const { id } = req.user;
  // const organization = await organizationService.getOrganizationByUserId(id);
  // if (!organization) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  // }

  const dummyData = {
    groups: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'],
    departments: ['Development', 'QA', 'Operations', 'Support', 'Research'],
    designations: ['Software Engineer', 'Marketing Specialist', 'Sales Manager', 'HR Coordinator', 'Financial Analyst'],
    locations: ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo'],
    employeeID: 'EMP123',
    name: {
      first: 'John',
      middle: 'D.',
      last: 'Doe',
    },
    email: 'john.doe@example.com',
    aadhaarNumber: '123412341234',
    dateOfJoining: '01-01-2021',
    dateOfBirth: '01-01-1990',
  };
  
  const excel = await excelServices.generateSampleEmployeeBulkUploadExcelSheet(dummyData);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=employee-bulk-upload-example.xlsx');
  res.status(httpStatus.OK).send(excel);
});