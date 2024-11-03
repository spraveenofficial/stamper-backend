import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { attendanceOfficeConfigService } from '../common/attendanceOfficeConfig';
import { IOptions } from '../paginate/paginate';
import { rolesEnum } from '../../config/roles';
import { attendanceServices } from '.';

export const createAttendanceConfigForOffice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { id: organizationId } = req.organization;

  const officeConfig = await attendanceOfficeConfigService.saveOfficeConfig(req.body, organizationId, id);

  res.status(httpStatus.CREATED).json({ success: true, message: req.t('AttendanceConfig.added'), data: officeConfig });
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
    console.log(req.organization);
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

  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: officeConfig });
});

export const getClockinButtonStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const response = await attendanceServices.checkIfEmployeeCanClockInToday(id);
  return res.status(httpStatus.OK).json({ success: true, message: 'Success', data: response });
});

export const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const {limit, page, status} = req.query;
  //@ts-ignore
  const pageToFn = Math.max(1, +page! || 1); // Default to page 1
  //@ts-ignore
  const limitToFn = Math.max(1, +limit! || 10); // Default to limit 10

  const statusToFn = (status as 'present' | 'absent' | 'all') || 'all';


  const response = await attendanceServices.getMyAttendance(id, pageToFn, limitToFn, statusToFn);
  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: response });
});

export const clockinEmployee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  if ('officeId' in req.organization) {
    req.body.officeId = req.organization.officeId;
    req.body.organizationId = req.organization.organizationId;
  }
  const response = await attendanceServices.clockinEmployee(id, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: response });
});


export const clockoutEmployee = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const response = await attendanceServices.clockoutEmployee(id, req.body);
  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: response });
});