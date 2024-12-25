import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { chatServices } from '.';
// import { ApiError } from '../errors';

export const createUserMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const { body } = req;
  // if (id === body.to) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot send message to yourself');
  // }
  const message = await chatServices.createMessage(body, id, body.to);

  res.status(httpStatus.CREATED).json({ success: true, message: 'Success', data: message });
});

export const getMyMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const messages = await chatServices.getRecentChats(id);

  res.status(httpStatus.OK).json({ success: true, message: 'Success', data: messages });
});
