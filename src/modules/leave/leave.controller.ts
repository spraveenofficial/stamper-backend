import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { leaveService } from '.';
import { rolesEnum } from '../../config/roles';
import { leaveAndPolicyService } from '../common/leavePolicies';
import { officeHolidayServices } from '../common/officeHolidays';
import { employeeService } from '../employee';
import { ApiError } from '../errors';
import { notificationServices } from '../notification';
import { officeServices } from '../office';
import { organizationService } from '../organization';
import { userService } from '../user';
import { catchAsync, pick } from '../utils';
import { LeaveStatus } from './leave.interfaces';
// import { eventServices } from '../events';

export const createLeave = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;

  const leaveType = await leaveAndPolicyService.getLeaveTypeById(req.body.leaveTypeId);
  if (!leaveType || !leaveType.policyId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave type not found');
  }

  const managerId = await employeeService.getEmployeeByUserId(id);
  const leave = await leaveService.createLeave(req.body, id, req.file);
  const user = await userService.getUserById(id);

  if (role === rolesEnum.moderator) {
    const organization = await organizationService.getOrganizationById(managerId!.organizationId);

    // console.log('Organization', organization);
    await notificationServices.createLeaveRequestNotification(
      organization!.userId! as any,
      user!.name,
      user?._id,
      leave._id
    );
  }

  if (role === rolesEnum.employee) {
    const office = await officeServices.getOfficeByOrgAndEmpId(managerId!.organizationId, managerId?.id);

    await notificationServices.createLeaveRequestNotification(office!.managerId, user!.name, user?._id, leave._id);
  }

  res.status(httpStatus.CREATED).json({
    message: 'Leave created successfully',
    success: true,
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
      success: true,
      leave,
    });
  }
});

export const getMyOwnLeaves = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const leaves = await leaveService.getLeaveByEmployeeId(id);
  res.status(httpStatus.OK).json({
    message: 'Leaves fetched successfully',
    success: true,
    data: leaves,
  });
});

export const updateLeaveStatusForOrgAndMods = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { leaveId } = req.body;

  const leave = await leaveService.updateLeaveStatus(req.body, new mongoose.Types.ObjectId(leaveId));
  if (leave.status === LeaveStatus.APPROVED) {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(leave?.employeeId as unknown as string));
    const managerInformation = await userService.getUserById(new mongoose.Types.ObjectId(id));
    console.log(managerInformation);
    await notificationServices.createLeaveApprovedNotification(
      user!.id,
      managerInformation!.name,
      managerInformation?.id,
      leave._id
    );
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
  const { id } = req.user;
  const { organizationId } = req.organizationContext;

  const holiday = await officeHolidayServices.addHoliday(id, organizationId, req.body);

  res.status(httpStatus.CREATED).json({ success: true, message: 'Holiday added successfully', data: holiday });
});

export const editHolidayForOffice = catchAsync(async (req: Request, res: Response) => {
  const { holidayId } = req.params;
  if (typeof req.params['holidayId'] === 'string') {
    const holiday = await officeHolidayServices.editHoliday(holidayId!, req.body);
    res.status(httpStatus.OK).json({ success: true, message: 'Holiday updated successfully', data: holiday });
  }
});

export const getHolidaysByOfficeIdAndYear = catchAsync(async (req: Request, res: Response) => {
  const { organizationId } = req.organizationContext;
  const { year } = pick(req.query, ['limit', 'page', 'year']);
  const { officeId } = req.params;

  let holidays;

  let filterOptions = {
    year: +year || new Date().getFullYear(),
  };

  holidays = await officeHolidayServices.getHolidaysForOffices(
    organizationId,
    typeof req.params['officeId'] === 'string' ? new mongoose.Types.ObjectId(officeId) : undefined,
    filterOptions.year
  );

  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: holidays });
});
