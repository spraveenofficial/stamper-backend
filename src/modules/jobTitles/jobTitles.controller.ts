import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { jobTitleService } from '.';
import { ApiError } from '../errors';
import { officeServices } from '../office';
import { catchAsync, pick } from '../utils';

export const addJobTitle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const { organizationId, officeId } = req.organizationContext;

  const office = await officeServices.getOfficeById(req.body.officeId);

  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office does not exist');
  }

  if (!office.isOperational) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office is not operational');
  }

  if (officeId?.toString() !== req.body.officeId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You are not authorized to add job title to this office');
  }

  const jobTitle = await jobTitleService.createJobTitle(req.body, id, officeId!, organizationId);

  //   TODO: FIX Multiple entry of job title
  res.status(httpStatus.CREATED).json({ success: true, data: jobTitle });
});

export const getJobTitles = catchAsync(async (req: Request, res: Response) => {
  const { officeId } = pick(req.query, ['officeId']);

  const { organizationId } = req.organizationContext;
  let jobTitles = await jobTitleService.getJobTitles(organizationId, officeId);

  res.status(httpStatus.OK).json({ success: true, message: 'Job titles fetched successfully', data: jobTitles ?? [] });
});

export const editJobTitle = catchAsync(async (req: Request, res: Response) => {
  const jobTitle = await jobTitleService.editJobTitleById(req.body.jobTitleId, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Successfully Executed', data: jobTitle });
});
