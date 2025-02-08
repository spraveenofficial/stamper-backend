import express, { Router } from 'express';
import { attendanceController } from '../../modules/attendance';
import { auth } from '../../modules/auth';
import { attendanceOfficeConfigValidations } from '../../modules/common/attendanceOfficeConfig';
import { organizationMiddleware } from '../../modules/organization';
import { validate } from '../../modules/validate';

const router: Router = express.Router();

router
  .route('/work-schedule')
  .post(
    auth(),
    validate(attendanceOfficeConfigValidations.addWorkScheduleRequest),
    organizationMiddleware.organizationMiddlewareV2,
    attendanceController.createWorkScheduleByOfficeId
  );

router
  .route('/work-schedule/:officeId')
  .get(
    auth(),
    validate(attendanceOfficeConfigValidations.getWorkScheduleByOfficeIdRequest),
    organizationMiddleware.organizationMiddlewareV2,
    attendanceController.getWorkScheduleByOfficeId
  );

router
  .route('/work-schedule')
  .put(
    auth(),
    validate(attendanceOfficeConfigValidations.updateWorkScheduleRequest),
    organizationMiddleware.organizationMiddleware,
    attendanceController.updateAttendanceConfigForOffice
  );

router
  .route('/office-config/:officeId')
  .get(
    auth('getAttendanceconfig'),
    organizationMiddleware.organizationMiddlewareV2,
    attendanceController.getAttendanceConfigForOffice
  );

router.get(
  '/office-general-settings/:officeId',
  auth(),
  organizationMiddleware.organizationMiddlewareV2,
  attendanceController.getOfficeAttendanceGeneralSettings
);

router
  .route('/button-status')
  .get(
    auth('getClockinButtonStatus'),
    organizationMiddleware.organizationMiddlewareV2,
    attendanceController.getClockinButtonStatus
  );

router
  .route('/my-attendance')
  .get(auth('getMyAttendance'), organizationMiddleware.organizationMiddlewareV2, attendanceController.getMyAttendance);

router
  .route('/clockin')
  .post(auth('clockin'), organizationMiddleware.organizationMiddlewareV2, attendanceController.clockinEmployee);

router
  .route('/clockout')
  .post(auth('clockout'), organizationMiddleware.organizationMiddlewareV2, attendanceController.clockoutEmployee);

router
  .route('/month-summary')
  .get(auth(), organizationMiddleware.organizationMiddleware, attendanceController.getEmployeeMonthSummary);

export default router;
