import express, { Router } from 'express';
// import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { attendanceController } from '../../modules/attendance';
import { organizationMiddleware } from '../../modules/organization';


const router: Router = express.Router();

router
  .route('/add-config')
  .post(auth('addAttendanceconfig'), organizationMiddleware.organizationMiddleware, attendanceController.createAttendanceConfigForOffice);



export default router;