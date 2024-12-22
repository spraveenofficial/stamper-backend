import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { groupChatServices } from '.';

export const createNewGroup = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const { body } = req;

  // Create group
  const group = await groupChatServices.createGroup(body, id);
  res.status(httpStatus.CREATED).json({ success: true, message: 'Group created successfully', data: group });
});
