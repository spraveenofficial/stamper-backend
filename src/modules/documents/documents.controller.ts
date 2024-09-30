import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { documentService } from '.';
import { organizationService } from '../organization';
import { ApiError } from '../errors';
import { rolesEnum } from '../../config/roles';
import { employeeService } from '../employee';

export const createFolder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const organization = await organizationService.getOrganizationByUserId(id);

  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  const folder = await documentService.createFolder(req.body, organization._id, id);

  res.status(httpStatus.CREATED).send(folder);
});

export const getFolders = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  let organizationId;
  if (req.user.role === rolesEnum.organization) {
    const organization = await organizationService.getOrganizationByUserId(id);
    organizationId = organization?._id;
  } else {
    const organization = await employeeService.getEmployeeByUserId(id);
    organizationId = organization?.organizationId;
  }
  if (!organizationId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  const folders = await documentService.getFolders(organizationId, req.user.role as rolesEnum);

  res.status(httpStatus.OK).json({ success: true, data: folders });
});
