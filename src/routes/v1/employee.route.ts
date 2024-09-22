import express, { Router } from 'express';
// import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { employeeController } from '../../modules/employee';


const router: Router = express.Router();

router.route('/activate').post(auth(), employeeController.updateEmploeeAccountStatus);


export default router;