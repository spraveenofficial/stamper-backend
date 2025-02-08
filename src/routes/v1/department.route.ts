import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { departmentController, departmentValidation } from '../../modules/departments';
import { organizationMiddleware } from '../../modules/organization';
import { rbacMiddleware } from '../../modules/rbac';
import { validate } from '../../modules/validate';

const router: Router = express.Router();

router
  .route('/add')
  .post(
    auth(),
    rbacMiddleware.checkPermission('department.create'),
    validate(departmentValidation.createDepartmentRequest),
    organizationMiddleware.organizationMiddlewareV2,
    departmentController.addDepartment
  );

router
  .route('/')
  .get(
    auth(),
    rbacMiddleware.checkPermission('department.read'),
    validate(departmentValidation.getDepartmentsRequest),
    organizationMiddleware.organizationMiddlewareV2,
    departmentController.getDepartments
  );

router
  .route('/edit')
  .put(
    auth(),
    rbacMiddleware.checkPermission('department.update'),
    validate(departmentValidation.editDepartmentRequest),
    organizationMiddleware.organizationMiddlewareV2,
    departmentController.editDepartment
  );

export default router;
