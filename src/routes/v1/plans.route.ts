import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { plansController } from '../../modules/common/plans';

const router: Router = express.Router();

router.route('/create-plan').post(auth(), plansController.createPlan);

/**
 * @api {get} v1/plans/get-plans Get Plans
 */

router.route('/list').get(plansController.getPlans);

export default router;
