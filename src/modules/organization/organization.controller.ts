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
import { departmentService } from '../departments';
import { officeServices } from '../office';
import { jobTitleService } from '../jobTitles';

export const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization(req.body, req.user.id);
  res.status(httpStatus.CREATED).json({ message: 'Organization created successfully', organization });
});

export const addEmployee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { user, employeeInformation } = req.body;
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  // Check if department is exist in organization
  const department = await departmentService.getDeparmentById(employeeInformation.departmentId);

  if (!department) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Department not found');
  }

  if (department.organizationId.toString() !== organization.id.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You can't add employee to another organization");
  }

  // Check if office is exist in organization
  const office = await officeServices.getOfficeById(employeeInformation.officeId);
  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office not found');
  }

  const jobTitle = await jobTitleService.getJobTitleById(employeeInformation.jobTitleId);

  if (!jobTitle) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Job title not found');
  }

  const employee = await userService.createUserAsEmployee(user, req.t);
  // TODO: Check if employee already exists
  const employeeInformations = await employeeService.addEmployee({
    ...employeeInformation,
    userId: employee.id as mongoose.Types.ObjectId,
    managerId: req.user.id as mongoose.Types.ObjectId,
    jobTitleId: jobTitle.id as mongoose.Types.ObjectId,
    organizationId: organization.id as mongoose.Types.ObjectId,
    officeId: office.id as mongoose.Types.ObjectId,
    departmentId: department.id as mongoose.Types.ObjectId,
  });
  
  const token = await tokenService.generateOrganizationInvitationToken(employee);

  if (DevelopmentOptions.production) {
    await emailService.inviteEmployee(employee.email, employee.name, employee?.name, token);
  }

  console.log('token for invite user -------> ', token);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Employee added successfully', employeeInformations });
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

export const getOrganizationChart = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  // TODO: Make this for employess as well

  const organization = await organizationService.getOrganizationByUserId(id);

  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  console.log('organization id -------> ', organization);
  const data = await organizationService.getOrgChartById(organization.id as mongoose.Types.ObjectId);

  return res.status(httpStatus.OK).json({ success: true, message: 'Fetch Success', data });
});

export const getOrganizationData = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const organization = await organizationService.getOrganizationByUserId(id);
  const responseData = {
    organizationAdded: !!organization,
    config: null,
  };
  if (!organization) return res.status(httpStatus.OK).json({ success: true, message: 'Fetch Success', data: responseData });
  const data = await organizationService.getOrgConfig(organization?.id as mongoose.Types.ObjectId);
  responseData.config = data;
  return res.status(httpStatus.OK).json({ success: true, message: 'Fetch Success', data: responseData });
});
