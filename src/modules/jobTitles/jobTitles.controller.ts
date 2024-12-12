import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { officeServices } from '../office';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { jobTitleService } from '.';
import { rolesEnum } from '../../config/roles';

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
  const { limit, page, officeId } = pick(req.query, ['limit', 'page', 'officeId']);
  
  const pageTonFn = Math.max(1, +page! || 1); // Default to page 1
  const limitToFn = Math.max(1, +limit! || 10); // Default to limit 10
  let jobTitles;

  if (req.user.role === rolesEnum.organization) {
    jobTitles = await jobTitleService.getJobTitles(req.organization.id, officeId, pageTonFn, limitToFn);
  } else {
    if ('officeId' in req.organization) {
      jobTitles = await jobTitleService.getJobTitles(req.organization.organizationId, officeId, page, limit);
    }
  }
  res.status(httpStatus.OK).json({ success: true, message: 'Job titles fetched successfully', data: jobTitles ?? [] });
});


export const editJobTitle = catchAsync(async (req: Request, res: Response) => {
  const jobTitle = await jobTitleService.editJobTitleById(req.body.jobTitleId, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Successfully Executed', data: jobTitle });
});