import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { employeeController, employeeValidation } from '../../modules/employee';


const router: Router = express.Router();

router.route('/activate').post(auth(), validate(employeeValidation.acceptInvitation),employeeController.updateEmploeeAccountStatus);


export default router;