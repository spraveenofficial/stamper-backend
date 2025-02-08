import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { documentService } from '.';
import { rolesEnum } from '../../config/roles';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { catchAsync } from '../utils';

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
  const { organizationId } = req.organizationContext;

  const folders = await documentService.getFolders(organizationId, req.user.role as rolesEnum);

  res.status(httpStatus.OK).json({ success: true, data: folders });
});
