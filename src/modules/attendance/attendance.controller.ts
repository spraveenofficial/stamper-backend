import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { attendanceServices } from '.';
import { rolesEnum } from '../../config/roles';
import { attendanceOfficeConfigService } from '../common/attendanceOfficeConfig';
import { IOptions } from '../paginate/paginate';
import { catchAsync, pick } from '../utils';

export const createWorkScheduleByOfficeId = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { organizationId } = req.organizationContext;

  const officeConfig = await attendanceOfficeConfigService.createNewWorkSchedule(req.body, organizationId, id);

  res.status(httpStatus.CREATED).json({ success: true, message: req.t('AttendanceConfig.added'), data: officeConfig });
});

export const getWorkScheduleByOfficeId = catchAsync(async (req: Request, res: Response) => {
  const { officeId } = req.params;

  if (typeof req.params['officeId'] === 'string') {
    const officeConfig = await attendanceOfficeConfigService.getWorkScheduleConfigByOfficeId(
      officeId as unknown as mongoose.Types.ObjectId
    );
    res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: officeConfig });
  }
});

export const updateAttendanceConfigForOffice = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;
  const { id: organizationId } = req.organization;

  let officeConfig;
  if (role === rolesEnum.organization) {
    officeConfig = await attendanceOfficeConfigService.updateOfficeConfig(req.body, organizationId);
  } else {
    if ('officeId' in req.organization) {
      officeConfig = await attendanceOfficeConfigService.updateOfficeConfig(req.body, organizationId);
    }
  }

  res.status(httpStatus.OK).json({ success: true, message: req.t('AttendanceConfig.updated'), data: officeConfig });
});

export const getAttendanceConfigForOffice = catchAsync(async (req: Request, res: Response) => {
  const { id: organizationId } = req.organization;
  const options: IOptions = pick(req.query, ['limit', 'page']);

  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10

  let officeConfig;

  // Check the role of the user and narrow the type accordingly
  if (req.user.role === rolesEnum.organization) {
    officeConfig = await attendanceOfficeConfigService.getOrganizationOfficeConfig(organizationId, undefined, page, limit);
  } else {
    // Type guard to ensure req.organization is IEmployeeDoc before accessing officeId
    if ('officeId' in req.organization) {
      officeConfig = await attendanceOfficeConfigService.getOrganizationOfficeConfig(
        req.organization.organizationId,
        req.organization.officeId,
        page,
        limit
      );
    }
  }

  res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: officeConfig });
});

export const getClockinButtonStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const response = await attendanceServices.checkIfEmployeeCanClockInToday(id);
  return res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: response });
});

export const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { limit, page, status } = pick(req.query, ['limit', 'page', 'status']);
  //@ts-ignore
  const pageToFn = Math.max(1, +page! || 1); // Default to page 1
  //@ts-ignore
  const limitToFn = Math.max(1, +limit! || 10); // Default to limit 10

  const statusToFn = status as 'present' | 'absent' | 'all';

  const response = await attendanceServices.getMyAttendance(id, pageToFn, limitToFn, statusToFn);
  res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: response });
});

export const clockinEmployee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  if ('officeId' in req.organization) {
    req.body.officeId = req.organization.officeId;
    req.body.organizationId = req.organization.organizationId;
  }
  const response = await attendanceServices.clockinEmployee(id, req.body);
  res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: response });
});

export const clockoutEmployee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const response = await attendanceServices.clockoutEmployee(id, req.body);
  res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: response });
});

export const getEmployeeMonthSummary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const response = await attendanceServices.getEmployeeMonthlySummary(id);

  res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: response });
});
