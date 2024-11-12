import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { userService } from '../user';
import { ApiError } from '../errors';
import { eventInterfaces, eventServices } from '.';

export const createEventFromCalendar = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { body } = req;

  const user = await userService.getUserById(id);

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found');
  }

  const event = await eventServices.createEvent(user.id, body, eventInterfaces.EventType.RESERVE);

  await res.status(httpStatus.OK).json({ success: true, message: 'Event created successfully', data: event });
});

export const getEvents = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const user = await userService.getUserById(id);

  const { startDate, endDate } = pick(req.query, ['startDate', 'endDate']);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const events = await eventServices.getEventsByCalendarView({ userId: user.id, startDate, endDate });

  return res.status(httpStatus.OK).json({ success: true, message: 'Events fetched successfully', data: events });
});
