import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { departmentController, departmentValidation } from '../../modules/departments';

const router: Router = express.Router();

router
  .route('/add')
  .post(auth('addDepartment'), validate(departmentValidation.createDepartmentRequest), departmentController.addDepartment);
router.route('/').get(auth('getDepartments'), validate(departmentValidation.getDepartmentsRequest), departmentController.getDepartments);
router.route('/edit').put(auth('editDepartment'), validate(departmentValidation.editDepartmentRequest), departmentController.editDepartment);

export default router;