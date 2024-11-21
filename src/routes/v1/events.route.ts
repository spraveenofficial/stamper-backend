import express, { Router } from 'express';
// import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { eventControllers } from '../../modules/events';
import { organizationMiddleware } from '../../modules/organization';

const router: Router = express.Router();

router.route('/reserve').post(auth(), eventControllers.createEventFromCalendar);
router.route('/calendar').get(auth(), organizationMiddleware.organizationMiddleware, eventControllers.getEvents);

export default router;
