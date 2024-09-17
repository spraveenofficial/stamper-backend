import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { validate } from '../../modules/validate';
import { leaveController, leaveValidation } from '../../modules/leave';

const router: Router = express.Router();

router.route('/').get(auth(), leaveController.getMyOwnLeaves);
router.route('/apply-leave').post(auth(), validate(leaveValidation.createLeave), leaveController.createLeave);
router.route('/:leaveId').patch(auth(), validate(leaveValidation.updateLeave), leaveController.updateLeave);
router.route('/status').post(auth('editLeaveStatus'), validate(leaveValidation.updateLeaveStatus), leaveController.updateLeaveStatus);

export default router;
