import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { departmentController, departmentValidation } from '../../modules/departments';
import { organizationMiddleware } from '../../modules/organization';

const router: Router = express.Router();

router
  .route('/add')
  .post(
    auth('addDepartment'),
    validate(departmentValidation.createDepartmentRequest),
    organizationMiddleware.organizationMiddleware,
    departmentController.addDepartment
  );

router
  .route('/')
  .get(
    auth('getDepartments'),
    validate(departmentValidation.getDepartmentsRequest),
    organizationMiddleware.organizationMiddleware,
    departmentController.getDepartments
  );

router
  .route('/edit')
  .put(
    auth('editDepartment'),
    validate(departmentValidation.editDepartmentRequest),
    organizationMiddleware.organizationMiddleware,
    departmentController.editDepartment
  );

export default router;
