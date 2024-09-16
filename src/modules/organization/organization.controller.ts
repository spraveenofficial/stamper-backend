import httpStatus from 'http-status';
import { Request, Response } from 'express';
import * as organizationService from './organization.service';
import { catchAsync } from '../utils';
import { userService } from '../user';
import { employeeService } from '../employee';
import { ApiError } from '../errors';

export const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization(req.body, req.user.id);
  res.status(httpStatus.CREATED).json({ message: 'Organization created successfully', organization });
});

export const addEmployee = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.getOrganizationByUserId(req.user.id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  const employee = await userService.createUserAsEmployee(req.body.user);
  const employeeInformation = await employeeService.addEmployee({
    ...req.body.employeeInformation,
    userId: employee.id,
    managerId: req.user.id,
  });
  res.status(httpStatus.CREATED).json({ employee, employeeInformation });
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