import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import * as organizationService from './organization.service';
import { userService } from '../user';
import { employeeService } from '../employee';
import { ApiError } from '../errors';
import mongoose from 'mongoose';
import { tokenService } from '../token';
import { DevelopmentOptions, rolesEnum } from '../../config/roles';
import { emailService } from '../email';
import { departmentService } from '../departments';
import { officeServices } from '../office';
import { jobTitleService } from '../jobTitles';
import { employeeAccountStatus, EmployeeStatus } from '../employee/employee.interfaces';

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
  const { limit, page, officeId, accountStatus, employeeStatus, name } = pick(req.query, [
    'limit',
    'page',
    'officeId',
    'accountStatus',
    'employeeStatus',
    'name',
  ]);
  // Pagination defaults
  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  // Prepare filtering criteria
  const filterOptions = {
    orgId: req.user.role === rolesEnum.organization ? req.organization.id : null,
    officeId: officeId || null,
    accountStatus: (accountStatus as employeeAccountStatus) || null,
    employeeStatus: (employeeStatus as EmployeeStatus) || null,
    name: name || null,
  };

  if(req.user.role === rolesEnum.moderator){
    if ('officeId' in req.organization) {
      filterOptions.officeId = req.organization.officeId
      filterOptions.orgId = req.organization.organizationId
    }
  }

  // Fetch employees with pagination and filters
  const employees = await employeeService.getEmployeesByOrgId(
    filterOptions.orgId,
    paginationOptions.page,
    paginationOptions.limit,
    filterOptions.officeId,
    filterOptions.accountStatus,
    filterOptions.employeeStatus,
    filterOptions.name
  );
  res.status(httpStatus.OK).json({ success: true, message: 'Fetch Success', data: employees });
});

export const getOrganizationChart = catchAsync(async (req: Request, res: Response) => {
  const {id} = req.organization;

  const data = await organizationService.getOrgChartById(id as mongoose.Types.ObjectId);

  return res.status(httpStatus.OK).json({ success: true, message: 'Fetch Success', data });
});

export const getOrganizationData = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;

  if (role === rolesEnum.organization) {
    // Fetch the organization data by user ID
    const organization = await organizationService.getOrganizationByUserId(id);

    // Prepare the response structure
    const responseData: any = {
      organizationAdded: !!organization,
      config: null,
      FLOWS: [],
    };
    const flowForEmployeeOnboarding = await organizationService.getOrgEmployeeOnBoardingFlow(
      organization?.id as mongoose.Types.ObjectId,
      !!organization
    );

    if (flowForEmployeeOnboarding) {
      responseData.FLOWS.push(flowForEmployeeOnboarding);
    }

    if (organization) {
      // Fetch the organization config
      const data = await organizationService.getOrgConfig(organization.id as mongoose.Types.ObjectId);
      responseData.config = data;
    }

    // Return the response with a success message
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Fetch Success',
      data: responseData,
    });
  } else {
    // Fetch the organization data by user ID
    const organization = await employeeService.getEmployeeByUserId(id);
    const org = await organizationService.getOrganizationById(organization!.organizationId);
    // Prepare the response structure
    const responseData: any = {
      organizationAdded: !!org,
      config: null,
      FLOWS: [],
    };
    const flowForEmployeeOnboarding = await organizationService.getOrgEmployeeOnBoardingFlow(
      org?.id as mongoose.Types.ObjectId,
      !!org
    );

    if (flowForEmployeeOnboarding) {
      responseData.FLOWS.push(flowForEmployeeOnboarding);
    }

    if (org) {
      // Fetch the organization config
      const data = await organizationService.getOrgConfig(org.id as mongoose.Types.ObjectId, organization!.officeId);
      responseData.config = data;
    }

    // Return the response with a success message
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Fetch Success',
      data: responseData,
    });
  }
});
