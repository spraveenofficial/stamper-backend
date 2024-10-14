import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { validate } from '../../modules/validate';
import { leaveController, leaveValidation } from '../../modules/leave';
import { upload } from '../../modules/utils/multer';

const router: Router = express.Router();

router.route('/').get(auth(), leaveController.getMyOwnLeaves);
router
  .route('/apply-leave')
  .post(auth(), upload.single('file'), validate(leaveValidation.createLeave), leaveController.createLeave);

router.route('/:leaveId').patch(auth(), validate(leaveValidation.updateLeave), leaveController.updateLeave);
router
  .route('/status')
  .post(auth('editLeaveStatus'), validate(leaveValidation.updateLeaveStatus), leaveController.updateLeaveStatus);


router.route('/organization/leave-type').
 put(auth('addLeaveType'), validate(leaveValidation.createLeaveType), leaveController.addLeaveType);
  
router.route('/organization/leave-policy').
  put(auth('addLeavePolicy'), validate(leaveValidation.createLeaveTypePolicy), leaveController.addPolicyToLeaveType);

router.route('/organization/leave-type/list').get(auth(), leaveController.getLeaveTypesWithPolicy);

router.route('/leave-types').get(auth(), leaveController.getOnlyLeaveTypes);

router.route('/balance').get(auth(), leaveController.getLeaveBalance);
  
export default router;
