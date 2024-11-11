import express, { Router } from 'express';
// import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { eventControllers } from '../../modules/events';

const router: Router = express.Router();

router.route('/reserve').post(auth(), eventControllers.createEventFromCalendar);

export default router;
