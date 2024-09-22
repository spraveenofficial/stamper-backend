import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { notificationServices } from '.';

/**
 * Get Notifications
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  try {
    const notifications = await notificationServices.getNotifications(id);
    res.status(httpStatus.OK).json({ notifications });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Something went wrong' });
  }
});
