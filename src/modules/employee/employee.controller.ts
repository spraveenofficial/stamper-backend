import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { employeeService } from '.';
import config from '../../config/config';
import { DevelopmentOptions, rolesEnum } from '../../config/roles';
import { BULL_AVAILABLE_JOBS, queueDBServices } from '../bullmqs';
import { bulkUploadQueue } from '../bullmqs/employeeBulkUpload.process';
import { excelServices } from '../common/services/excel-service';
import { userPersonalInformationService } from '../common/userPersonalInformation';
import { emailService } from '../email';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { tokenService, tokenTypes } from '../token';
import { userService } from '../user';
import { catchAsync, pick } from '../utils';
import { employeeAccountStatus } from './employee.interfaces';

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
  await userService.updateUserById(user.id, { isEmailVerified: true });
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

  if (user.role == rolesEnum.organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is not an employee');
  }

  const employeeStatus = await employeeService.getEmployeeByUserId(user._id);
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
  const { organizationId, officeId } = req.organizationContext

  const orgConfig = await organizationService.getOrgOfficeNDepartmentNJobTitle(organizationId, officeId);
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
  const { page, limit, name } = pick(req.query, ['page', 'limit', 'name']);
  const { organizationId, officeId } = req.organizationContext;
  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  const directory = await employeeService.getEmployeesByOrgId(
    organizationId,
    paginationOptions.page,
    paginationOptions.limit,
    officeId!.toString(),
    null,
    null,
    name as string
  )
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
  const { id } = req.user;
  const { employees } = req.body;
  const { organizationId: orgId } = req.organizationContext;

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
    data: employees,
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
    const task = await queueDBServices.getBulkUploadInformationForEachTask(userId, id as unknown as mongoose.Types.ObjectId);

    if (!task) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    res.status(httpStatus.OK).json({ success: true, message: 'Successfully Fetched', data: task });
  }
});

export const searchEmployeeBasedOnNameAndEmail = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { page, limit, search } = pick(req.query, ['page', 'limit', 'search']);

  const { organizationId, officeId } = req.organizationContext;

  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  let employees = await employeeService.searchEmployeeByNameAndEmail(
    organizationId,
    id,
    officeId,
    paginationOptions.page,
    paginationOptions.limit,
    search as string
  );


  res.status(httpStatus.OK).json({ success: true, message: 'Employee fetched successfully', data: employees });
});
