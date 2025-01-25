import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { userPersonalInformationValidations } from '../../modules/common/userPersonalInformation';
import { employeeController, employeeValidation } from '../../modules/employee';
import { organizationMiddleware } from '../../modules/organization';
import { validate } from '../../modules/validate';

const router: Router = express.Router();

router
  .route('/directory')
  .get(auth(), organizationMiddleware.organizationMiddleware, employeeController.getEmployeeDirectory);

router
  .route('/activate')
  .post(validate(employeeValidation.acceptInvitation), employeeController.updateEmploeeAccountStatus);

//Employee Search
router
  .route('/search')
  .get(auth(), organizationMiddleware.organizationMiddleware, employeeController.searchEmployeeBasedOnNameAndEmail);

router.route('/reinvite').post(auth(), validate(employeeValidation.reinviteEmployee), employeeController.reinviteEmployee);

router
  .route('/bulk-upload-dummy-excel')
  .get(auth(), organizationMiddleware.organizationMiddleware, employeeController.generateBulkUploadEmployeeExcelExample);

router
  .route('/bulk-upload')
  .post(auth(), organizationMiddleware.organizationMiddleware, employeeController.bulkUploadEmployees);

router
  .route('/bulk-upload/list')
  .get(auth(), organizationMiddleware.organizationMiddleware, employeeController.myBulkUploads);

router
  .route('/bulk-upload/:id')
  .get(auth(), organizationMiddleware.organizationMiddleware, employeeController.getEachBulkUploadInformation);

router
  .route('/info/:id')
  .get(auth(), validate(employeeValidation.employeeInformationRequestValidation), employeeController.getEmployeeDetailById);

router
  .route('/edit/:id')
  .put(
    auth(),
    validate(userPersonalInformationValidations.userPersonalInfoValidationSchema),
    employeeController.updateEmployeePersonalInformation
  );

export default router;
