import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { departmentService } from '.';
import { rolesEnum } from '../../config/roles';
import { ApiError } from '../errors';
import { officeServices } from '../office';
import { IOptions } from '../paginate/paginate';
import { catchAsync, pick } from '../utils';

export const addDepartment = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;
  const { organizationId, officeId } = req.organizationContext;

  if (role !== rolesEnum.organization && officeId?.toString() !== req.body.officeId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You are not authorized to add department to this office');
  }

  const office = await officeServices.getOfficeById(req.body.officeId);
  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Departments.officeDoesNotExist'));
  }

  if (!office.isOperational) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Departments.officeDoesNotOperational'));
  }

  const department = await departmentService.createDepartment(req.body, id, office.id, organizationId);

  res
    .status(httpStatus.CREATED)
    .json({ success: true, message: req.t('Departments.deparmentAddSuccess'), data: department });
});

export const getDepartments = catchAsync(async (req: Request, res: Response) => {
  const { organizationId } = req.organizationContext;
  const options: IOptions = pick(req.query, ['officeId']);
  const officeId = options.officeId ? new mongoose.Types.ObjectId(options.officeId) : null;

  // if (userOfficeId?.toString() !== officeId!.toString()) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'You are not authorized to get departments of this office');
  // }

  const departments = await departmentService.getDepartments(organizationId, officeId!);
  res.status(httpStatus.OK).json({ success: true, data: departments });
});




export const editDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await departmentService.editDepartment(req.body.departmentId, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Successfully Executed', data: department });
});
