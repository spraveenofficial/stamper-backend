import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as organizationService from './organization.service';
import { userService } from '../user';
import { employeeService } from '../employee';
import { ApiError } from '../errors';
import mongoose from 'mongoose';
import { tokenService } from '../token';
import { DevelopmentOptions } from '../../config/roles';
import { emailService } from '../email';
import { IOptions } from '../paginate/paginate';

export const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization(req.body, req.user.id);
  res.status(httpStatus.CREATED).json({ message: 'Organization created successfully', organization });
});

export const addEmployee = catchAsync(async (req: Request, res: Response) => {
  // console.log(req.body);
  // const user = await userService.createUserAsEmployee(req.body.user);
  const organization = await organizationService.getOrganizationByUserId(req.user.id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  const employee = await userService.createUserAsEmployee(req.body.user);
  const employeeInformation = await employeeService.addEmployee({
    ...req.body.employeeInformation,
    userId: employee.id,
    managerId: req.user.id as mongoose.Types.ObjectId,
    organizationId: organization.id as mongoose.Types.ObjectId,
  });

  //TODO: Create token and send invitation email

  const token = await tokenService.generateOrganizationInvitationToken(employee);

  if (DevelopmentOptions.production) {
    await emailService.inviteEmployee(employee.email, employee.name, employee?.name, token);
  }

  console.log('token for invite user -------> ', token);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Employee added successfully', employeeInformation });
});

export const getOrganizationEmployees = catchAsync(async (req: Request, res: Response) => {
  const options: IOptions = pick(req.query, ['limit', 'page']);
  const organization = await organizationService.getOrganizationByUserId(req.user.id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }
  
  // Set default values for pagination
  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10
  const employees = await employeeService.getEmployeesByManagerId(req.user.id, page, limit);
  res.status(httpStatus.OK).json({ data: employees });
});
