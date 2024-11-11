import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { leaveService } from '.';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { employeeService } from '../employee';
import { rolesEnum } from '../../config/roles';
import { notificationServices } from '../notification';
import { userService } from '../user';
import { LeaveStatus } from './leave.interfaces';
import { organizationService } from '../organization';
import { leaveAndPolicyService } from '../common/leavePolicies';
import { ApiError } from '../errors';
import { officeServices } from '../office';
import { officeHolidayServices } from '../common/officeHolidays';
import { IHolidayDoc } from '../common/officeHolidays/holidays.interfaces';
// import { eventServices } from '../events';

export const createLeave = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  // Check if from date is greater than to date
  // if (new Date(req.body.startDate) > new Date(req.body.endDate)) {
  //   res.status(httpStatus.BAD_REQUEST).json({
  //     message: 'Start date cannot be greater than end date',
  //   });
  // }

  // Check if start date is less than current date
  // if (new Date(req.body.startDate) < new Date()) {
  //   res.status(httpStatus.BAD_REQUEST).json({
  //     message: 'Start date cannot be less than current date',
  //   });
  // }

  // Check if start date is more than 3 months
  // if(new Date(req.body.startDate) > new Date(new Date().setMonth(new Date().getMonth() + 3))) {
  //   res.status(httpStatus.BAD_REQUEST).json({
  //     message: 'Start date cannot be more than 3 months',
  //   });
  // }
  const leaveType = await leaveAndPolicyService.getLeaveTypeById(req.body.leaveTypeId);
  if (!leaveType || !leaveType.policyId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave type not found');
  }

  const user = await userService.getUserById(id);
  const managerId = await employeeService.getEmployeeByUserId(id);
  const leave = await leaveService.createLeave(req.body, id, req.file);
  const office = await officeServices.getOfficeByOrgAndEmpId(managerId!.organizationId, managerId?.id);
  if (req.user?.role !== rolesEnum.organization && managerId) {
    await notificationServices.createLeaveRequestNotification(office!.managerId, user!.name, user?._id, leave._id);
  }

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Leave created successfully',
    leave,
  });
});

export const updateLeave = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { leaveId } = req.params;
  if (typeof req.params['leaveId'] === 'string') {
    const leave = await leaveService.updateLeaveById(req.body, new mongoose.Types.ObjectId(leaveId), id);
    res.status(httpStatus.OK).json({
      message: 'Leave Updated Successfully',
      leave,
      success: true,
    });
  }
});

export const getMyOwnLeaves = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const leaves = await leaveService.getLeaveByEmployeeId(id);
  res.status(httpStatus.OK).json({
    message: 'Leaves fetched successfully',
    data: leaves,
    success: true,
  });
});

export const updateLeaveStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { leaveId } = req.body;

  const leave = await leaveService.updateLeaveStatus(req.body, new mongoose.Types.ObjectId(leaveId), id);
  if (leave.status === LeaveStatus.APPROVED) {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(leave?.employeeId as unknown as string));
    const managerInformation = await userService.getUserById(new mongoose.Types.ObjectId(id));
    await notificationServices.createLeaveApprovedNotification(
      user!.id,
      managerInformation!.name,
      managerInformation?.id,
      leave._id
    );
    // await eventServices.createEvent(
    //   leave?.employeeId,
    //   {
    //     title: 
    //   }
    // )
  }

  res.status(httpStatus.OK).json({
    message: 'Leave Updated Successfully',
    leave,
  });
});

export const addLeaveType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const organization = await organizationService.getOrganizationByUserId(id);

  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Organization not found');
  }

  const leave = await leaveAndPolicyService.createLeaveType({ ...req.body, organizationId: organization!.id }, req.t);

  return res.status(httpStatus.CREATED).json({
    message: 'Leave type added successfully',
    leave,
  });
});

export const addPolicyToLeaveType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const organization = await organizationService.getOrganizationByUserId(id);

  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Organization not found');
  }

  const leave = await leaveAndPolicyService.createLeavePolicy(req.body, req.t);

  return res.status(httpStatus.CREATED).json({
    message: 'Policy added to leave type successfully',
    leave,
  });
});

export const getLeaveTypesWithPolicy = catchAsync(async (req: Request, res: Response) => {
  let leave;
  if (req.user.role === rolesEnum.organization) {
    leave = await leaveAndPolicyService.getLeaveTypesByOrganizationId(req.organization.id);
  } else {
    if ('officeId' in req.organization) {
      leave = await leaveAndPolicyService.getLeaveTypesByOrganizationId(req.organization.organizationId);
    }
  }

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Leave types fetched successfully',
    leave,
  });
});

export const getOnlyLeaveTypes = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;
  let organization: any;
  if (role === rolesEnum.organization) {
    organization = req.organization.id;
  } else {
    if ('officeId' in req.organization) {
      organization = req.organization.organizationId;
    }
  }

  const leave = await leaveAndPolicyService.getOnlyLeaveTypesByOrganizationId(organization);

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Leave types fetched successfully',
    data: leave,
  });
});

export const getLeaveBalance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const user = await userService.getUserById(id);

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  let orgId;
  if (req.user?.role === rolesEnum.organization) {
    const organization = await organizationService.getOrganizationByUserId(id);
    orgId = organization?.id;
  } else {
    const employee = await employeeService.getEmployeeByUserId(id);
    orgId = employee?.organizationId;
  }

  if (!orgId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Organization not found');
  }

  const leave = await leaveAndPolicyService.getLeavesbalanceByOrgAndEmployeeId(orgId, user.id);

  return res.status(httpStatus.OK).json({
    success: true,
    message: 'Leave balance fetched successfully',
    data: leave,
  });
});

export const addHolidayForOffice = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;
  const { id: organizationId } = req.organization;

  let holiday: IHolidayDoc | null = null;

  if (role === rolesEnum.organization) {
    holiday = await officeHolidayServices.addHoliday(id, organizationId, req.body);
  } else {
    if ('officeId' in req.organization) {
      holiday = await officeHolidayServices.addHoliday(id, req.organization.organizationId, req.body);
    }
  }

  res.status(httpStatus.CREATED).json({ success: true, message: 'Holiday added successfully', data: holiday });
});

export const editHolidayForOffice = catchAsync(async (req: Request, res: Response) => {
  const holiday = await officeHolidayServices.editHoliday(req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Holiday updated successfully', data: holiday });  
});

export const getOfficesHolidays = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;

  const { limit, page, year } = pick(req.query, ['limit', 'page', 'year']);

  let holidays;

  let filterOptions = {
    limit: Math.max(1, +limit! || 10),
    page: Math.max(1, +page! || 1),
    year: +year || new Date().getFullYear(),
  };

  if (role === rolesEnum.organization) {
    holidays = await officeHolidayServices.getHolidaysForOffices(
      req.organization.id,
      undefined,
      filterOptions.page,
      filterOptions.limit,
      filterOptions.year
    );
  } else {
    if ('officeId' in req.organization) {
      holidays = await officeHolidayServices.getHolidaysForOffices(
        req.organization.organizationId,
        req.organization.officeId,
        page,
        limit,
        filterOptions.year
      );
    }
  }

  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: holidays });
});
