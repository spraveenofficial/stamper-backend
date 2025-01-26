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
  .patch(
    auth(),
    validate(attendanceOfficeConfigValidations.updateWorkScheduleRequest),
    organizationMiddleware.organizationMiddleware,
    attendanceController.updateAttendanceConfigForOffice
  );

router
  .route('/get-config')
  .get(
    auth('getAttendanceconfig'),
    organizationMiddleware.organizationMiddleware,
    attendanceController.getAttendanceConfigForOffice
  );

router
  .route('/button-status')
  .get(
    auth('getClockinButtonStatus'),
    organizationMiddleware.organizationMiddleware,
    attendanceController.getClockinButtonStatus
  );

router
  .route('/my-attendance')
  .get(auth('getMyAttendance'), organizationMiddleware.organizationMiddleware, attendanceController.getMyAttendance);

router
  .route('/clockin')
  .post(auth('clockin'), organizationMiddleware.organizationMiddleware, attendanceController.clockinEmployee);

router
  .route('/clockout')
  .post(auth('clockout'), organizationMiddleware.organizationMiddleware, attendanceController.clockoutEmployee);

router
  .route('/month-summary')
  .get(auth(), organizationMiddleware.organizationMiddleware, attendanceController.getEmployeeMonthSummary);

export default router;
