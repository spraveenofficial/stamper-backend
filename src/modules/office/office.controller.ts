import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { organizationService } from '../organization';
import { officeServices } from '.';
import { IOptions } from '../paginate/paginate';
import { pick } from '../utils';

export const addOffice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
  }
  const response = await officeServices.addOffice(req.body, id, organization.id);
  res.status(httpStatus.OK).json({ message: 'Office added successfully', data: response });
});

export const getOffices = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const options: IOptions = pick(req.query, ['limit', 'page']);
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
  }

  // Set default values for pagination
  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10
  const response = await officeServices.getOffices(organization.id, page, limit);
  res.status(httpStatus.OK).json({ success: true, data: response });
});

export const editOffice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  // Check if user has rights to edit the office
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
  }

  // Check if the office exists
  const office = await officeServices.getOfficeById(req.body.officeId);

  if (!office) {
    throw res.status(httpStatus.NOT_FOUND).json({ message: 'Office not found' });
  }

  // Check if the office belongs to the organization
  if (office.organizationId.toString() !== organization.id.toString()) {
    throw res.status(httpStatus.BAD_REQUEST).json({ message: 'This office does not belong to the organization' });
  }
  
  const response = await officeServices.editOffice(req.body.officeId, req.body);
  res.status(httpStatus.OK).json({ message: 'Office updated successfully', data: response });
});
