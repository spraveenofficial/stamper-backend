import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { notificationControllers, notificationValidations } from '../../modules/notification';

const router: Router = express.Router();

router.route('/').get(auth(), notificationControllers.getNotifications);
router
  .route('/seen/:id')
  .post(auth(), validate(notificationValidations.markNotificationAsSeen), notificationControllers.markNotificationAsSeen);
router.route('/seen/bulk').put(auth(), notificationControllers.markAllNotificationsAsSeen);
router.route('/delete/:id').delete(auth(), notificationControllers.deleteNotification);
router.route('/delete/all').delete(auth(), notificationControllers.deleteAllNotifications);

export default router;
