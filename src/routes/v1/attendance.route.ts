import express, { Router } from 'express';
// import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { attendanceController } from '../../modules/attendance';
import { organizationMiddleware } from '../../modules/organization';

const router: Router = express.Router();

router
  .route('/add-config')
  .post(
    auth('addAttendanceconfig'),
    organizationMiddleware.organizationMiddleware,
    attendanceController.createAttendanceConfigForOffice
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

export default router;
