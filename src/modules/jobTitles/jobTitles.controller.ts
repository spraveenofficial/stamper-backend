import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { officeServices } from '../office';
import { ApiError } from '../errors';
import { jobTitleService } from '.';
import { rolesEnum } from '../../config/roles';

export const addJobTitle = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;

  let organizationId;
  let officeId;

  const office = await officeServices.getOfficeById(req.body.officeId);

  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office does not exist');
  }

  if (!office.isOperational) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office is not operational');
  }

  if (role === rolesEnum.organization) {
    organizationId = req.organization.id;
    officeId = req.body.officeId;
  } else {
    if ('officeId' in req.organization) {
      organizationId = req.organization.organizationId;
      officeId = req.organization.officeId;
    }
  }

  if(officeId?.toString() !== req.body.officeId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You are not authorized to add job title to this office');
  }

  const jobTitle = await jobTitleService.createJobTitle(req.body, id, officeId, organizationId);

  //   TODO: FIX Multiple entry of job title
  res.status(httpStatus.CREATED).json({ success: true, data: jobTitle });
});

export const getJobTitles = catchAsync(async (req: Request, res: Response) => {
  const { officeId } = pick(req.query, ['officeId']);
  
  let jobTitles;

  if (req.user.role === rolesEnum.organization) {
    jobTitles = await jobTitleService.getJobTitles(req.organization.id, officeId);
  } else {
    if ('officeId' in req.organization) {
      jobTitles = await jobTitleService.getJobTitles(req.organization.organizationId, req.organization.officeId);
    }
  }
  res.status(httpStatus.OK).json({ success: true, message: 'Job titles fetched successfully', data: jobTitles ?? [] });
});


export const editJobTitle = catchAsync(async (req: Request, res: Response) => {
  const jobTitle = await jobTitleService.editJobTitleById(req.body.jobTitleId, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Successfully Executed', data: jobTitle });
});