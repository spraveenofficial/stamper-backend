import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { officeServices } from '../office';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { jobTitleService } from '.';

export const addJobTitle = catchAsync(async (req: Request, res: Response) => {
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

  const jobTitle = await jobTitleService.createJobTitle(req.body, id, office.id, organization.id);

  //   TODO: FIX Multiple entry of job title
  res.status(httpStatus.CREATED).json({ success: true, data: jobTitle });
});

export const getJobTitles = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }
  const options = pick(req.query, ['limit', 'page']);
  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10
  const jobTitles = await jobTitleService.getJobTitles(organization.id, page, limit);
  res.status(httpStatus.OK).json({ success: true, message: 'Job titles fetched successfully', data: jobTitles });
});
