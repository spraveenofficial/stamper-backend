import express, { Router } from 'express';
// import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { officeControllers } from '../../modules/office';



const router: Router = express.Router();

router.route('/add').post(auth('addOffice'), officeControllers.addOffice);


export default router;