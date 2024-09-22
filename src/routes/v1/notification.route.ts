import express, { Router } from 'express';
// import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { notificationControllers } from '../../modules/notification';

const router: Router = express.Router();

router.route('/').get(auth(), notificationControllers.getNotifications);

export default router;
