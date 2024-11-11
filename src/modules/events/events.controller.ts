import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
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
