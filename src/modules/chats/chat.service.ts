import mongoose, { PipelineStage } from 'mongoose';
import { IMessageDoc, NewMessageType } from './chat.interfaces';
import Message from './chat.model';

export const createMessage = async (
  messageBody: NewMessageType,
  from: mongoose.Types.ObjectId,
  to: mongoose.Types.ObjectId
): Promise<IMessageDoc> => {
  return await Message.create({
    ...messageBody,
    from,
    to,
  });
};

export const getAllMessagesByUserId = async (userId: mongoose.Types.ObjectId): Promise<IMessageDoc[] | null> => {
  const messages = await Message.find({
    to: new mongoose.Types.ObjectId(userId),
  }).exec();
  return messages;
};

export const getMyRecentChats = async (userId: mongoose.Types.ObjectId) => {
    const user = new mongoose.Types.ObjectId(userId);
  
    const pipeline: PipelineStage[] = [
      {
        $match: {
          $or: [{ from: user }, { to: user }],
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort messages by newest first
        },
      },
      {
        $group: {
          _id: {
            chatPartner: {
              $cond: {
                if: { $eq: ['$from', user] },
                then: '$to',
                else: '$from',
              },
            },
          },
          lastMessage: { $first: '$$ROOT' }, // Get the most recent message in the group
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$to', user] }, { $eq: ['$seen', false] }] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users', // Assuming a 'users' collection
          localField: '_id.chatPartner',
          foreignField: '_id',
          as: 'chatPartner',
        },
      },
      {
        $unwind: '$chatPartner',
      },
      {
        $project: {
          _id: 0,
          userName: '$chatPartner.name',
          profilePic: '$chatPartner.profilePic',
          lastMessage: {
            $cond: {
              if: { $not: '$lastMessage.deletedAt' }, // Check if lastMessage is not deleted
              then: '$lastMessage.content',
              else: null,
            },
          },
          lastMessageType: {
            $cond: {
              if: { $not: '$lastMessage.deletedAt' }, // Check if lastMessage is not deleted
              then: '$lastMessage.type',
              else: null,
            },
          },
          lastMessageAt: '$lastMessage.createdAt',
          unreadCount: 1,
          userId: '$chatPartner._id',
        },
      },
      {
        $sort: {
          lastMessageAt: -1, // Sort by latest message timestamp
        },
      },
    ];
  
    return await Message.aggregate(pipeline);
  };
  