import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { userService } from '../user';
import { ApiError } from '../errors';
import { tokenService, tokenTypes } from '../token';
import { employeeService } from '.';
import { employeeAccountStatus } from './employee.interfaces';
import { DevelopmentOptions, rolesEnum } from '../../config/roles';
import { emailService } from '../email';
import config from '../../config/config';
import mongoose from 'mongoose';
import { excelServices } from '../common/services/excel-service';
import { organizationService } from '../organization';
import { userPersonalInformationService } from '../common/userPersonalInformation';

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
  user.isEmailVerified = true;
  await user.save();
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

export const generateBulkUploadEmployeeExcelExample = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;

  let officeId;
  let orgId;
  if (role === rolesEnum.organization) {
    orgId = req.organization.id;
  } else if ('officeId' in req.organization) {
    orgId = req.organization.organizationId;
    officeId = req.organization.officeId;
  }

  const orgConfig = await organizationService.getOrgOfficeNDepartmentNJobTitle(orgId, officeId);
  const excel = await excelServices.generateSampleEmployeeBulkUploadExcelSheet(
    orgConfig.offices,
    orgConfig.departments,
    orgConfig.jobtitles
  );
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=employee-bulk-upload-example.xlsx');
  res.status(httpStatus.OK).send(excel);
});

export const getEmployeeDirectory = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;
  const { page, limit } = pick(req.query, ['page', 'limit']);

  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  let directory: any;

  if (role === rolesEnum.organization) {
    directory = await employeeService.getEmployeesByOrgId(
      req.organization.id,
      paginationOptions.page,
      paginationOptions.limit
    );
  } else {
    if ('officeId' in req.organization) {
      directory = await employeeService.getEmployeesByOrgId(
        req.organization.organizationId,
        paginationOptions.page,
        paginationOptions.limit,
        req.organization.officeId.toString()
      );
    }
  }

  res.status(httpStatus.OK).json({ success: true, message: 'Employee directory fetched successfully', data: directory });
});

export const getEmployeeDetailById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('ID', id);
  const employee = await employeeService.getEmployeeInformation(id as any);
  res.status(httpStatus.OK).json({ success: true, message: 'Employee fetched successfully', data: employee });
});

export const updateEmployeePersonalInformation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("ID", id);
  const { body } = req;
  if (typeof req.params['id'] === 'string') {
    const employee = await userPersonalInformationService.updateOneUserPersonalInfo(
      id! as unknown as mongoose.Types.ObjectId,
      body
    );
    res.status(httpStatus.OK).json({ success: true, message: 'Employee updated successfully', data: employee });
  }
});
