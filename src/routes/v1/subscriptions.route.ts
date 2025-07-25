import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { organizationMiddleware } from '../../modules/organization';
import { subscriptionControllers } from '../../modules/subscriptions';

const router: Router = express.Router();

router.route('/list').get(auth(), organizationMiddleware.organizationMiddlewareV2, subscriptionControllers.getMySubscriptions);

export default router;
