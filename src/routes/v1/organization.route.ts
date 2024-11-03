import express, { Router } from 'express';
import { organizationController, organizationValidation } from '../../modules/organization';
import { auth } from '../../modules/auth';
import { validate } from '../../modules/validate';
import { employeeValidation } from '../../modules/employee';
import { organizationMiddleware } from '../../modules/organization/organization.middleware';

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

router.get(
  '/employees',
  auth('getEmployees'),
  validate(employeeValidation.getEmployeeRequestValidation),
  organizationMiddleware,
  organizationController.getOrganizationEmployees
);

router.get('/org-chart', auth(), organizationMiddleware, organizationController.getOrganizationChart);

router.get('/data', auth(), organizationController.getOrganizationData);

export default router;
