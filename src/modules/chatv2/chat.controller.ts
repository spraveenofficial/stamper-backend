import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { chatService } from '.';
import mongoose from 'mongoose';

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { receiverId, groupId, } = req.body;

    let result;
    if (groupId) {
      // Group message
      result = await chatService.sendGroupMessage(
        new mongoose.Types.ObjectId(groupId),
        new mongoose.Types.ObjectId(id),
        req.body
      );
    } else if (receiverId) {
      // Private message
      result = await chatService.sendMessage(id, receiverId, req.body);
    } else {
      throw new Error('Either receiverId or groupId is required');
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.log('Error: ', error);
    return res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: error.message });
  }
});

export const getMyMessage = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.user;

    console.log('id', id);
    const messages = await chatService.getMessages(new mongoose.Types.ObjectId(id));

    return res.status(200).json(messages);
  } catch (error: any) {
    console.log('Error: ', error);
    return res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: error.message });
  }
});

export const createGroupChat = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { groupName, participants } = req.body;

    const chat = await chatService.createGroupChat(groupName, new mongoose.Types.ObjectId(id), participants);

    return res.status(201).json(chat);
  } catch (error: any) {
    console.log('Error: ', error);
    return res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: error.message });
  }
});
