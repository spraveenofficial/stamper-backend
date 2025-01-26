import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { organizationMiddleware } from '../../modules/organization';
import { paymentsController } from '../../modules/payments';

const router: Router = express.Router();

router.post('/initiate', auth(), organizationMiddleware.organizationMiddleware, paymentsController.initiatePayment);




// Webhook for payment status update
router.post('/webhook', paymentsController.paymentsWebhook);

export default router;
