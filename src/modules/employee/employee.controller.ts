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
import { bulkUploadQueue } from '../bullmqs/employeeBulkUpload.process';
import { BULL_AVAILABLE_JOBS, queueDBServices } from '../bullmqs';

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

  // const token_for = await tokenService.generateOrganizationInvitationToken(user);
  // console.log('Token:', token_for);
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
  const { page, limit, name } = pick(req.query, ['page', 'limit', 'name']);

  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  let directory: any;

  if (role === rolesEnum.organization) {
    directory = await employeeService.getEmployeesByOrgId(
      req.organization.id,
      paginationOptions.page,
      paginationOptions.limit,
      null,
      null,
      null,
      name as string
    );
  } else {
    if ('officeId' in req.organization) {
      directory = await employeeService.getEmployeesByOrgId(
        req.organization.organizationId,
        paginationOptions.page,
        paginationOptions.limit,
        req.organization.officeId.toString(),
        null,
        null,
        name as string
      );
    }
  }

  res.status(httpStatus.OK).json({ success: true, message: 'Employee directory fetched successfully', data: directory });
});

export const getEmployeeDetailById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id!)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Something went wrong',
    });
  }

  const employee = await employeeService.getEmployeeInformation(id as any);

  if (!employee) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Employee not found',
    });
  }

  return res.status(httpStatus.OK).json({ success: true, message: 'Employee fetched successfully', data: employee });
});

export const updateEmployeePersonalInformation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { body } = req;
  if (typeof req.params['id'] === 'string') {
    const employee = await userPersonalInformationService.updateOneUserPersonalInfo(
      id! as unknown as mongoose.Types.ObjectId,
      body
    );
    res.status(httpStatus.OK).json({ success: true, message: 'Employee updated successfully', data: employee });
  }
});

export const bulkUploadEmployees = catchAsync(async (req: Request, res: Response) => {
  const { role, id } = req.user;
  const { employees } = req.body;

  let orgId;
  if (role === rolesEnum.organization) {
    orgId = req.organization.id;
  } else if ('officeId' in req.organization) {
    orgId = req.organization.organizationId;
  }

  const job = await bulkUploadQueue.add(
    'bulk_upload',
    {
      organizationId: orgId,
      userId: id,
      employees,
      // translation: req.t,
      type: BULL_AVAILABLE_JOBS.EMPLOYEE_BULK_UPLOAD,
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  const newTask = await queueDBServices.createNewQueueTask({
    userId: req.user.id,
    dataToProcess: employees.length,
    data: [],
    jobType: BULL_AVAILABLE_JOBS.EMPLOYEE_BULK_UPLOAD,
    jobId: job.id as string,
  });

  res.status(httpStatus.OK).json({ success: true, message: 'Employee uploaded successfully', data: newTask });
});

export const myBulkUploads = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { page, limit } = pick(req.query, ['page', 'limit']);

  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  const tasks = await queueDBServices.getQueueTasksByUserId(
    id,
    BULL_AVAILABLE_JOBS.EMPLOYEE_BULK_UPLOAD,
    paginationOptions.page,
    paginationOptions.limit
  );

  res.status(httpStatus.OK).json({ success: true, message: 'Successfully Fetched', data: tasks });
});

export const getEachBulkUploadInformation = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user;
  const { id } = req.params;

  if (typeof req.params['id'] === 'string') {
    console.log('id:', id);
    const task = await queueDBServices.getBulkUploadInformationForEachTask(userId, id as unknown as mongoose.Types.ObjectId);

    if (!task) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    res.status(httpStatus.OK).json({ success: true, message: 'Successfully Fetched', data: task });
  }
});

export const searchEmployeeBasedOnNameAndEmail = catchAsync(async (req: Request, res: Response) => {
  const { role, id } = req.user;
  const { page, limit, search } = pick(req.query, ['page', 'limit', 'search']);

  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  let employees: any;

  if (role === rolesEnum.organization) {
    employees = await employeeService.searchEmployeeByNameAndEmail(
      req.organization.id,
      id,
      null,
      paginationOptions.page,
      paginationOptions.limit,
      search as string,
    );
  } else {
    if ('officeId' in req.organization) {
      employees = await employeeService.searchEmployeeByNameAndEmail(
        req.organization.organizationId,
        id,
        req.organization.officeId,
        paginationOptions.page,
        paginationOptions.limit,
        search as string
      );
    }
  }

  res.status(httpStatus.OK).json({ success: true, message: 'Employee fetched successfully', data: employees });
});
