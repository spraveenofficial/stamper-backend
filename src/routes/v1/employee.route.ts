import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { employeeController, employeeValidation } from '../../modules/employee';
import { organizationMiddleware } from '../../modules/organization';


const router: Router = express.Router();

router.route('/directory').get(auth(), organizationMiddleware.organizationMiddleware, employeeController.getEmployeeDirectory)
router.route('/activate').post(auth(), validate(employeeValidation.acceptInvitation),employeeController.updateEmploeeAccountStatus);
router.route('/reinvite').post(auth(), validate(employeeValidation.reinviteEmployee),employeeController.reinviteEmployee);
router.route('/bulk-upload-dummy-excel').get(auth(), organizationMiddleware.organizationMiddleware, employeeController.generateBulkUploadEmployeeExcelExample);
router.route('/info/:id').get(auth(), employeeController.getEmployeeDetailById);

export default router;