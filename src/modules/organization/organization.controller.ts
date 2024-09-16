import httpStatus from 'http-status';
import { Request, Response } from 'express';
import * as organizationService from './organization.service';
import { catchAsync } from '../utils';
import { userService } from '../user';
import { employeeService } from '../employee';
import { ApiError } from '../errors';

export const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(organization);
});

export const addEmployee = catchAsync(async (req: Request, res: Response) => {
  // check if organization is added by user
  const organization = await organizationService.checkIfOrganizationAddedByUser(req.user.id);
  if(!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }
  const employee = await userService.createUserAsEmployee(req.body.user);
  const employeeInformation = await employeeService.addEmployee({ ...req.body.employeeInformation, userId: employee.id, managerId: req.user.id });
  res.status(httpStatus.CREATED).json({ employee, employeeInformation });
});
