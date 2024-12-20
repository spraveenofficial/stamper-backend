import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { officeServices } from '../office';
import { ApiError } from '../errors';
import { departmentService } from '.';
import { IOptions } from '../paginate/paginate';
import mongoose from 'mongoose';

export const addDepartment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  let organizationId;
  let officeId;
  if (req.user.role === 'organization') {
    organizationId = req.organization._id;
  } else {
    if ('officeId' in req.organization) {
      organizationId = req.organization.organizationId;
      officeId = req.organization.officeId;
    }

    if (officeId?.toString() !== req.body.officeId.toString()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You are not authorized to add department to this office');
    }
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
  const { role } = req.user;
  let organizationId;
  let userOfficeId;
  const options: IOptions = pick(req.query, ['officeId']);
  const officeId = options.officeId ? new mongoose.Types.ObjectId(options.officeId) : null;

  
  if (role === 'organization') {
    organizationId = req.organization._id;
  } else {
    if ('officeId' in req.organization) {
      organizationId = req.organization.organizationId;
      userOfficeId = req.organization.officeId;
    }

    if (userOfficeId?.toString() !== officeId!.toString()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'You are not authorized to get departments of this office');
    }
  }

  const departments = await departmentService.getDepartments(organizationId, officeId!);
  res.status(httpStatus.OK).json({ success: true, data: departments });
});




export const editDepartment = catchAsync(async (req: Request, res: Response) => {
  const department = await departmentService.editDepartment(req.body.departmentId, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Successfully Executed', data: department });
});
