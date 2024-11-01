import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { attendanceOfficeConfigService } from '../common/attendanceOfficeConfig';
import { IOptions } from '../paginate/paginate';
import { rolesEnum } from '../../config/roles';

export const createAttendanceConfigForOffice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { id: organizationId } = req.organization;

  const officeConfig = await attendanceOfficeConfigService.saveOfficeConfig(req.body, organizationId, id);

  res.status(httpStatus.CREATED).json({ success: true, message: req.t('AttendanceConfig.added'), data: officeConfig });
});

export const getAttendanceConfigForOffice = catchAsync(async (req: Request, res: Response) => {
  //@ts-ignore
  const { id } = req.user;
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
        organizationId,
        req.organization.officeId,
        page,
        limit
      );
    }
  }

  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: officeConfig });
});
