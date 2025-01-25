import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { officeHolidayValidations } from '../../modules/common/officeHolidays';
import { leaveController, leaveValidation } from '../../modules/leave';
import { organizationMiddleware } from '../../modules/organization';
import { upload } from '../../modules/utils/multer';
import { validate } from '../../modules/validate';

const router: Router = express.Router();

router.route('/').get(auth(), leaveController.getMyOwnLeaves);
router
  .route('/apply-leave')
  .post(
    auth(),
    upload.single('file'),
    validate(leaveValidation.createLeave),
    organizationMiddleware.organizationMiddleware,
    leaveController.createLeave
  );

router
  .route('/:leaveId')
  .patch(auth(), upload.single('file'), validate(leaveValidation.updateLeave), leaveController.updateLeave);

router
  .route('/status')
  .post(
    auth('editLeaveStatus'),
    validate(leaveValidation.updateLeaveStatus),
    leaveController.updateLeaveStatusForOrgAndMods
  );

router
  .route('/organization/leave-type')
  .put(auth('addLeaveType'), validate(leaveValidation.createLeaveType), leaveController.addLeaveType);

router
  .route('/organization/leave-policy')
  .put(auth('addLeavePolicy'), validate(leaveValidation.createLeaveTypePolicy), leaveController.addPolicyToLeaveType);

router
  .route('/organization/leave-type/list')
  .get(auth(), organizationMiddleware.organizationMiddleware, leaveController.getLeaveTypesWithPolicy);

router.route('/leave-types').get(auth(), organizationMiddleware.organizationMiddleware, leaveController.getOnlyLeaveTypes);

router.route('/balance').get(auth(), leaveController.getLeaveBalance);

// Holidays

router
  .route('/organization/holiday')
  .post(
    auth('addHoliday'),
    validate(officeHolidayValidations.createHoliday),
    organizationMiddleware.organizationMiddlewareV2,
    leaveController.addHolidayForOffice
  );

router
  .route('/office/holiday/:officeId')
  .get(auth(), organizationMiddleware.organizationMiddlewareV2, leaveController.getHolidaysByOfficeIdAndYear);

router
  .route('/organization/holiday/:holidayId')
  .put(
    auth(),
    validate(officeHolidayValidations.updateHolidayRequest),
    organizationMiddleware.organizationMiddleware,
    leaveController.editHolidayForOffice
  );

export default router;
