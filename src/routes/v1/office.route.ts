import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { officeControllers, officeValidations } from '../../modules/office';

const router: Router = express.Router();

router.route('/add').post(auth('addOffice'), validate(officeValidations.creatOfficeRequest), officeControllers.addOffice);
router.route('/edit').put(auth('editOffice'), validate(officeValidations.editOfficeRequest), officeControllers.editOffice);
router.route('/list').get(auth('getOffices'), officeControllers.getOffices);

export default router;
