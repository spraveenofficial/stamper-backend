import express, { Router } from 'express';
import { organizationController, organizationValidation } from '../../modules/organization';
import { auth } from '../../modules/auth';
import { validate } from '../../modules/validate';

const router: Router = express.Router();
router.post(
  '/add-organization',
  auth('addOrganization'),
  validate(organizationValidation.organizationRegisterBody),
  organizationController.createOrganization
);

router.post(
  '/add-employee',
  auth('addEmployee'),
  validate(organizationValidation.addEmployee),
  organizationController.addEmployee
);

router.get('/employees', auth('getEmployees'), organizationController.getOrganizationEmployees);
router.get('/org-chart', auth(), organizationController.getOrganizationChart);

export default router;
