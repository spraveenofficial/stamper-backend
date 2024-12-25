import mongoose from 'mongoose';
import { IMessage } from './chat.interfaces';
import Message from './chat.model';
import { ApiError } from '../errors';

// Send a message
export const createMessage = async (
  messageBody: Omit<IMessage, 'from' | 'to' | 'createdAt' | 'updatedAt'>, // Ensures the body doesn't have these fields
  from: mongoose.Types.ObjectId,
  to: mongoose.Types.ObjectId | null
): Promise<IMessage> => {
  try {
    const newMessage = new Message({
      ...messageBody,
      from,
      to,
      seen: false,
      seenAt: null,
      reaction: null,
      deletedAt: null,
    });

    await newMessage.save();
    return newMessage;
  } catch (error) {
    console.error(error);
    throw new ApiError(500, 'Internal Server Error'); // Custom error for better handling
  }
};

// Fetch all messages for a user (both individual and group chats)
export const getAllMessagesByUserId = async (
  userId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 20
): Promise<IMessage[]> => {
  try {
    const skip = (page - 1) * limit;

    // Find all messages where the user is the receiver (either individual or group chat)
    const messages = await Message.find({
      $or: [
        { to: userId }, // Individual message
        { groupId: { $ne: null }, 'participants.user': userId }, // Group chat
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages;
  } catch (error) {
    console.error(error);
    throw new ApiError(500, 'Internal Server Error'); // Custom error for better handling
  }
};

// Fetch messages for a specific chat (individual or group)
export const getMessagesByChatId = async (
  chatId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 20
): Promise<IMessage[]> => {
  try {
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [{ groupId: chatId }, { to: chatId }],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages;
  } catch (error) {
    console.error(error);
    throw new ApiError(500, 'Internal Server Error'); // Custom error for better handling
  }
};

// Mark message as seen
export const markMessageAsSeen = async (messageId: mongoose.Types.ObjectId): Promise<void> => {
  try {
    await Message.findByIdAndUpdate(messageId, {
      seen: true,
      seenAt: new Date(),
    }).exec();
  } catch (error) {
    console.error(error);
    throw new ApiError(500, 'Internal Server Error'); // Custom error for better handling
  }
};

export const getRecentChats = async (user: mongoose.Types.ObjectId) => {
  const userId = new mongoose.Types.ObjectId(user);

  const pipeline: any = [
    {
      $match: {
        $or: [
          { from: userId },
          { to: userId },
          { chatId: { $exists: true }, 'participants.user': userId },
        ],
      },
    },
    {
      $addFields: {
        isGroup: { $ifNull: ['$chatId', false] },
        chatPartner: {
          $cond: {
            if: { $eq: ['$from', userId] },
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
    {
      $lookup: {
        from: 'groups',
        localField: 'chatId',
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
    {
      $sort: { createdAt: -1 }, // Ensure messages are sorted by createdAt, with the latest first
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$isGroup', true] },
            then: '$chatId', // Use chatId for group chats
            else: '$chatPartner', // Use userId for individual chats
          },
        },
        lastMessage: { $first: '$content' },
        lastMessageAt: { $first: '$createdAt' },
        userName: {
          $first: { $ifNull: ['$userDetails.name', '$groupDetails.name'] },
        },
        profilePic: {
          $first: { $ifNull: ['$userDetails.avatar', '$groupDetails.groupProfilePic'] },
        },
        isGroup: { $first: '$isGroup' },
        chatType: {
          $first: {
            $cond: {
              if: { $eq: ['$isGroup', true] },
              then: 'group',
              else: 'individual',
            },
          },
        },
        groupId: { $first: '$chatId' },
        unseenCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$seen', false] }, // Seen should be false
                  { $ne: ['$from', userId] }, // Message should not be from the current user
                  {
                    $or: [
                      { $eq: ['$to', userId] }, // Message directed to the current user
                      {
                        $and: [
                          { $eq: ['$isGroup', true] }, // If it's a group message
                          { $ne: ['$from', userId] }, // Ensure the message is not from the current user
                        ],
                      },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        chatId: {
          $cond: {
            if: { $eq: ['$chatType', 'group'] },
            then: '$groupId',
            else: '$_id',
          },
        },
        lastMessage: 1,
        userName: 1,
        profilePic: 1,
        lastMessageAt: 1,
        isGroup: 1,
        chatType: 1,
        unseenCount: 1,
      },
    },
    {
      $sort: { lastMessageAt: -1 }, // Sort the final result based on the last message time
    },
  ];

  const chats = await Message.aggregate(pipeline);
  return chats;
};
