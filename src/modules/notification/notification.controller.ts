import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { notificationServices } from '.';
import { pick } from '../utils';
import { IOptions } from '../paginate/paginate';
import Notification from './notification.model';
/**
 * Get Notifications
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  try {
    const filter = { to: id };
    const options: IOptions = pick(req.query, ['limit', 'page']);
    options.projectBy = 'createdAt,message,seen,url,type,from';
    options.sortBy = 'createdAt:desc';

    const notifications = await Notification.paginate(filter, options);
    res.status(httpStatus.OK).json({ success: true, message: 'Fetch Success', data: notifications });
  } catch (error) {
    console.log(error);
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Something went wrong' });
  }
});

/**
 * Mark Notification As Seen
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

export const markNotificationAsSeen = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const notification = await notificationServices.markNotoificationAsSeen(id as string);
    res.status(httpStatus.OK).json({ notification });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Something went wrong' });
  }
});

/**
 * Delete Notification
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await notificationServices.deleteNotificationById(id as string);
    res.status(httpStatus.OK).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Something went wrong' });
  }
});

/**
 * Delete All Notifications
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

export const deleteAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  try {
    await Notification.deleteMany({ to: id });
    res.status(httpStatus.OK).json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Something went wrong' });
  }
});

/**
 * Mark All Notifications As Seen
 * @param req
 * @param res
 * @returns {Promise<void>}
 */

export const markAllNotificationsAsSeen = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  try {
    await notificationServices.markAllNotificationsAsSeen(id as string);
    res.status(httpStatus.OK).json({ message: 'All notifications marked as seen' });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Something went wrong' });
  }
});
