import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { employeeValidation } from '../../modules/employee';
import { organizationController, organizationValidation } from '../../modules/organization';
import { organizationMiddleware, organizationMiddlewareV2 } from '../../modules/organization/organization.middleware';
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
  organizationMiddlewareV2,
  organizationController.addEmployee
);

router.get(
  '/employees',
  auth('getEmployees'),
  validate(employeeValidation.getEmployeeRequestValidation),
  organizationMiddleware,
  organizationController.getOrganizationEmployees
);

router.get('/org-chart', auth(), organizationMiddlewareV2, organizationController.getOrganizationChart);

router.get('/data', auth(), organizationController.getOrganizationData);

export default router;
