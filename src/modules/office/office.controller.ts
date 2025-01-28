import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { officeServices } from '.';
import { rolesEnum } from '../../config/roles';
import { employeeService } from '../employee';
import { IOptions } from '../paginate/paginate';
import { userService } from '../user';
import { pick } from '../utils';
import catchAsync from '../utils/catchAsync';

export const addOffice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { organizationId } = req.organizationContext;
  const response = await officeServices.addOffice(req.body, id, organizationId);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Office added successfully', data: response });
});

export const getOffices = catchAsync(async (req: Request, res: Response) => {
  const options: IOptions = pick(req.query, ['limit', 'page']);
  const { organizationId, officeId } = req.organizationContext;
  // Set default values for pagination

  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10
  const response = await officeServices.getOffices(organizationId, officeId!, page, limit);
  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: response });
});

export const editOffice = catchAsync(async (req: Request, res: Response) => {
  // Check if user has rights to edit the office
  const { organizationId, officeId: userOfficeId } = req.organizationContext;

  if (userOfficeId?.toString() !== req.body.officeId.toString()) {
    throw res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'You are not authorized to edit this office' });
  }
  // Check if the office exists
  const office = await officeServices.getOfficeById(req.body.officeId);

  if (!office) {
    throw res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Office not found' });
  }

  // Check if the office belongs to the organization
  if (office.organizationId.toString() !== organizationId.toString()) {
    throw res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'This office does not belong to the organization' });
  }

  const response = await officeServices.editOffice(req.body.officeId, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Office updated successfully', data: response });
});

// export const getEachOfficeDetails = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.user;
//   const organization = await organizationService.getOrganizationByUserId(id);
//   if (!organization) {
//     throw res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
//   }

//   const response = await officeServices.getOfficeById(req.params.officeId);
//   res.status(httpStatus.OK).json({ message: 'Success', data: response });
// });

export const assignManagerToOffice = catchAsync(async (req: Request, res: Response) => {
  const { managerId, officeId } = req.body;
  const isEmployee = await employeeService.getEmployeeByOfficeIdAndEmpId(officeId, managerId);
  if (!isEmployee) {
    throw res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Manager does not belong to this office' });
  }

  const response = await officeServices.editOffice(officeId, { managerId: new mongoose.Types.ObjectId(managerId) });
  await userService.updateUserById(managerId, { role: rolesEnum.moderator });

  res.status(httpStatus.OK).json({ success: true, message: 'Manager assigned successfully', data: response });
});


export const assignRoleToOffice = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const { id } = req.user;
  // @ts-ignore
  const { role, officeId, employeeId } = req.body;


  const employee = await employeeService.getEmployeeByOfficeIdAndEmpId(officeId, employeeId);

  if (!employee) {
    throw res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Employee does not belong to this office' });
  }
});