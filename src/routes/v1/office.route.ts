import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { officeControllers, officeValidations } from '../../modules/office';
import { organizationMiddleware } from '../../modules/organization';
import { rbacMiddleware } from '../../modules/rbac';
import { validate } from '../../modules/validate';

const router: Router = express.Router();

router
  .route('/add')
  .post(
    auth(),
    validate(officeValidations.creatOfficeRequest),
    rbacMiddleware.checkPermission('office.create'),
    organizationMiddleware.organizationMiddlewareV2,
    officeControllers.addOffice
  );

router
  .route('/edit')
  .put(
    auth(),
    validate(officeValidations.editOfficeRequest),
    rbacMiddleware.checkPermission('office.update'),
    organizationMiddleware.organizationMiddlewareV2,
    officeControllers.editOffice
  );

router
  .route('/list')
  .get(
    auth(),
    rbacMiddleware.checkPermission('office.read'),
    organizationMiddleware.organizationMiddlewareV2,
    officeControllers.getOffices
  );

router.route('/assign-manager').put(auth('editOfficeManager'), officeControllers.assignManagerToOffice);


export default router;
