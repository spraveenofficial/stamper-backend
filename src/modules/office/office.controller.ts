import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { officeServices } from '.';
import { rolesEnum } from '../../config/roles';
import { employeeService } from '../employee';
import { employeeAccountStatus, EmployeeStatus } from '../employee/employee.interfaces';
import { organizationService } from '../organization';
import { IOptions } from '../paginate/paginate';
import { userService } from '../user';
import { pick } from '../utils';
import catchAsync from '../utils/catchAsync';

export const addOffice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    throw res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
  }
  const response = await officeServices.addOffice(req.body, id, organization.id);
  res.status(httpStatus.CREATED).json({ message: 'Office added successfully', data: response });
});

export const getOffices = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;
  const options: IOptions = pick(req.query, ['limit', 'page']);
  let organizationId;
  let officeId;
  if (role === rolesEnum.organization) {
    organizationId = req.organization._id;
  } else {
    if ('officeId' in req.organization) {
      organizationId = req.organization.organizationId;
      officeId = req.organization.officeId;
    }
  }
  // Set default values for pagination
  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10
  const response = await officeServices.getOffices(organizationId, officeId, page, limit);
  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: response });
});

export const editOffice = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;
  // Check if user has rights to edit the office
  let organizationId;
  let userOfficeId;
  if (role === rolesEnum.organization) {
    organizationId = req.organization._id;
  } else {
    if ('officeId' in req.organization) {
      organizationId = req.organization.organizationId;
      userOfficeId = req.organization.officeId;
    }

    if (userOfficeId?.toString() !== req.body.officeId.toString()) {
      throw res.status(httpStatus.BAD_REQUEST).json({ message: 'You are not authorized to edit this office' });
    }
  }
  // Check if the office exists
  const office = await officeServices.getOfficeById(req.body.officeId);

  if (!office) {
    throw res.status(httpStatus.NOT_FOUND).json({ message: 'Office not found' });
  }

  // Check if the office belongs to the organization
  if (office.organizationId.toString() !== organizationId.toString()) {
    throw res.status(httpStatus.BAD_REQUEST).json({ message: 'This office does not belong to the organization' });
  }

  const response = await officeServices.editOffice(req.body.officeId, req.body);
  res.status(httpStatus.OK).json({ message: 'Office updated successfully', data: response });
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

export const getEmployeesByOfficeId = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;
  const { limit, page, officeId, accountStatus, employeeStatus, name } = pick(req.query, [
    'limit',
    'page',
    'officeId',
    'accountStatus',
    'employeeStatus',
    'name',
  ]);

  let organization;
  if (role === rolesEnum.organization) {
    const org = await organizationService.getOrganizationByUserId(id);
    organization = org?._id;
  } else {
    const org = await employeeService.getEmployeeByUserId(id);
    organization = org?.organizationId;
  }

  const paginationOptions = {
    page: Math.max(1, +page || 1),
    limit: Math.max(1, +limit || 10),
  };

  // Prepare filtering criteria
  const filterOptions = {
    officeId: officeId || null,
    accountStatus: (accountStatus as employeeAccountStatus) || null,
    employeeStatus: (employeeStatus as EmployeeStatus) || null,
    name: name || null,
  };

  const employees = await employeeService.getEmployeesByOrgId(
    organization._id,
    paginationOptions.page,
    paginationOptions.limit,
    filterOptions.officeId,
    filterOptions.accountStatus,
    filterOptions.employeeStatus,
    filterOptions.name
  );

  res.status(httpStatus.OK).json({ message: 'Success', data: employees });
});

export const assignManagerToOffice = catchAsync(async (req: Request, res: Response) => {
  const { managerId, officeId } = req.body;
  const isEmployee = await employeeService.getEmployeeByOfficeIdAndEmpId(officeId, managerId);
  if (!isEmployee) {
    throw res.status(httpStatus.BAD_REQUEST).json({ message: 'Manager does not belong to this office' });
  }
  const response = await officeServices.editOffice(officeId, { managerId: new mongoose.Types.ObjectId(managerId) });
  await userService.updateUserById(managerId, { role: rolesEnum.moderator });
  res.status(httpStatus.OK).json({ message: 'Manager assigned successfully', data: response });
});
