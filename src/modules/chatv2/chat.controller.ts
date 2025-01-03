import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { chatService } from '.';
import mongoose from 'mongoose';

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { receiverId, groupId } = req.body;

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
    const { limit, page } = pick(req.query, ['limit', 'page']);

    const pageToFn = Math.max(1, +page! || 1); // Default to page 1
    const limitToFn = Math.max(1, +limit! || 10); // Default to limit 10
    const messages = await chatService.getMessages(new mongoose.Types.ObjectId(id), pageToFn, limitToFn);

    return res.status(httpStatus.OK).json({ success: true, message: 'Success', data: messages });
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

export const getMessageByChatId = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { limit, page, chatId } = pick(req.query, ['limit', 'page', 'chatId']);

    const pageToFn = Math.max(1, +page! || 1); // Default to page 1
    const limitToFn = Math.max(1, +limit! || 10); // Default to limit 10
    const messages = await chatService.getMessagesByChatId(
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(chatId),
      pageToFn,
      limitToFn
    );

    return res.status(httpStatus.OK).json({ success: true, message: 'Success', data: messages });
  } catch (error: any) {
    console.log('Error: ', error);
    return res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: error.message });
  }
});
