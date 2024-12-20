import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { officeControllers, officeValidations } from '../../modules/office';
import { organizationMiddleware } from '../../modules/organization';

const router: Router = express.Router();

router.route('/add').post(auth('addOffice'), validate(officeValidations.creatOfficeRequest), officeControllers.addOffice);

router
  .route('/edit')
  .put(
    auth('editOffice'),
    validate(officeValidations.editOfficeRequest),
    organizationMiddleware.organizationMiddleware,
    officeControllers.editOffice
  );
  
router.route('/list').get(auth('getOffices'), organizationMiddleware.organizationMiddleware, officeControllers.getOffices);

router.route('/assign-manager').put(auth('editOfficeManager'), officeControllers.assignManagerToOffice);
export default router;
