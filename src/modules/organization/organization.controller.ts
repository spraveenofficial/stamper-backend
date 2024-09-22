import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import * as organizationService from './organization.service';
import { userService } from '../user';
import { employeeService } from '../employee';
import { ApiError } from '../errors';
import mongoose from 'mongoose';
import { tokenService } from '../token';
import { DevelopmentOptions } from '../../config/roles';
import { emailService } from '../email';

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

  if(DevelopmentOptions.production){
    await emailService.inviteEmployee(employee.email, employee.name, employee?.name,  token);
  }

  console.log('token for invite user -------> ', token);
  res.status(httpStatus.CREATED).json({ sucess: true, message: 'Employee added successfully', employeeInformation });
});

export const getOrganizationEmployees = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.getOrganizationByUserId(req.user.id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  const employees = await employeeService.getEmployeesByManagerId(req.user.id);

  // const employees = await employeeService.getEmployeesByOrganizationId(organization.id);
  res.status(httpStatus.OK).json({ employees: employees });
});
