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

export const getRecentChats = async (userId: mongoose.Types.ObjectId) => {
    const user = new mongoose.Types.ObjectId(userId);
  
    const pipeline: PipelineStage[] = [
      // Match individual messages and group messages
      {
        $match: {
          $or: [
            { from: user },
            { to: user },
            { groupId: { $exists: true }, 'participants.user': user },
          ],
        },
      },
      // Handle individual and group message sorting
      {
        $addFields: {
          isGroup: { $ifNull: ['$groupId', false] },
          chatPartner: {
            $cond: {
              if: { $eq: ['$from', user] },
              then: '$to',
              else: '$from',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'chatPartner',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      // Join with group data if it's a group chat
      {
        $lookup: {
          from: 'chatgroups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'groupDetails',
        },
      },
      {
        $unwind: {
          path: '$groupDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project final fields
      {
        $project: {
          unreadCount: {
            $cond: [
              { $and: [{ $eq: ['$to', user] }, { $eq: ['$seen', false] }] },
              1,
              0,
            ],
          },
          userName: {
            $cond: {
              if: '$isGroup',
              then: '$groupDetails.name',
              else: '$userDetails.name',
            },
          },
          profilePic: {
            $cond: {
              if: '$isGroup',
              then: '$groupDetails.groupProfilePic',
              else: '$userDetails.avatar',
            },
          },
          lastMessage: '$content',
          lastMessageType: '$type',
          lastMessageAt: '$createdAt',
          userId: {
            $cond: {
              if: '$isGroup',
              then: '$groupDetails._id',
              else: '$userDetails._id',
            },
          },
          type: {
            $cond: {
              if: '$isGroup',
              then: 'group',
              else: 'individual',
            },
          },
        },
      },
      // Group and aggregate the final data
      {
        $group: {
          _id: {
            userId: '$userId',
            type: '$type',
          },
          userName: { $first: '$userName' },
          profilePic: { $first: '$profilePic' },
          lastMessage: { $first: '$lastMessage' },
          lastMessageType: { $first: '$lastMessageType' },
          lastMessageAt: { $max: '$lastMessageAt' },
          unreadCount: { $sum: '$unreadCount' },
          type: { $first: '$type' },
          userId: { $first: '$userId' },
        },
      },
      {
        $sort: {
          lastMessageAt: -1, // Sort by most recent activity
        },
      },
    ];
  
    const chats = await Message.aggregate(pipeline);
  
    return chats;
  };
  