import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { officeServices } from '../office';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { departmentService } from '.';
import { IOptions } from '../paginate/paginate';

export const addDepartment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const office = await officeServices.getOfficeById(req.body.officeId);
  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office does not exist');
  }
  if (!office.isOperational) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office is not operational');
  }
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }
  const department = await departmentService.createDepartment(req.body, id, office.id, organization.id);
  res.status(httpStatus.CREATED).json(department);
});

export const getDepartments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }
  const options: IOptions = pick(req.query, ['limit', 'page']);
  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10
  const departments = await departmentService.getDepartments(organization.id, page, limit);
  res.status(httpStatus.OK).json({ success: true, data: departments });
});
