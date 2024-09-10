import express, { Router } from 'express';
import { organizationController, organizationValidation } from '../../modules/organization';
import { auth } from '../../modules/auth';
import { validate } from '../../modules/validate';


const router: Router = express.Router();
router.post('/register', auth(), validate(organizationValidation.organizationRegisterBody), organizationController.createOrganization);

export default router;