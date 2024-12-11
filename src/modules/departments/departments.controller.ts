import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { officeServices } from '../office';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { departmentService } from '.';
import { IOptions } from '../paginate/paginate';
import mongoose from 'mongoose';

export const addDepartment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const office = await officeServices.getOfficeById(req.body.officeId);
  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Departments.officeDoesNotExist'));
  }
  if (!office.isOperational) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Departments.officeDoesNotOperational'));
  }
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Departments.addOrganizationFirst'));
  }
  const department = await departmentService.createDepartment(req.body, id, office.id, organization.id);

  res
    .status(httpStatus.CREATED)
    .json({ success: true, message: req.t('Departments.deparmentAddSuccess'), data: department });
});

export const getDepartments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Departments.addOrganizationFirst'));
  }
  const options: IOptions = pick(req.query, ['officeId']);
  const officeId = options.officeId ? new mongoose.Types.ObjectId(options.officeId) : null;
  const departments = await departmentService.getDepartments(organization.id, officeId!);
  res.status(httpStatus.OK).json({ success: true, data: departments });
});

export const editDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await departmentService.editDepartment(req.body.departmentId, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Successfully Executed', data: department });
});
