import httpStatus from 'http-status';
import { Request, Response } from 'express';
import * as organizationService from './organization.service';
import { catchAsync } from '../utils';

export const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const organization = await organizationService.createOrganization(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(organization);
});
