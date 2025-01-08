import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { organizationMiddleware } from '../../modules/organization';
import { paymentsController } from '../../modules/payments';

const router: Router = express.Router();

router.post('/initiate', auth(), organizationMiddleware.organizationMiddleware, paymentsController.initiatePayment);


export default router;
