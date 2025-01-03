import mongoose, { PipelineStage } from 'mongoose';
import { Chat, Message } from './chat.model';
import { ChatType, IMessageDoc } from './chat.interfaces';
import { ApiError } from '../errors';
import httpStatus from 'http-status';

export const createPrivateChat = async (user1: mongoose.Types.ObjectId, user2: mongoose.Types.ObjectId) => {
  const user1Id = new mongoose.Types.ObjectId(user1);
  const user2Id = new mongoose.Types.ObjectId(user2);
  const existingChat = await Chat.findOne({
    type: 'private',
    'participants.user': { $all: [user1Id, user2Id] },
  });

  if (existingChat) {
    return existingChat;
  }

  return await Chat.create({
    type: 'private',
    participants: [
      { user: user1Id, role: 'member', joinedAt: new Date() },
      { user: user2Id, role: 'member', joinedAt: new Date() },
    ],
  });
};

export const createGroupChat = async (
  groupName: string,
  creatorId: mongoose.Types.ObjectId,
  members: mongoose.Types.ObjectId[]
) => {
  const participants = [
    { user: new mongoose.Types.ObjectId(creatorId), role: 'admin', joinedAt: new Date() },
    ...members.map((id) => ({
      user: new mongoose.Types.ObjectId(id),
      role: 'member',
      joinedAt: new Date(),
    })),
  ];

  return await Chat.create({
    type: ChatType.Group,
    groupName: groupName,
    participants,
  });
};

export const getMessages = async (userId: mongoose.Types.ObjectId, page: number = 1, limit: number = 10) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    // Match chats where user is an active participant
    {
      $match: {
        participants: {
          $elemMatch: {
            user: userObjectId,
            removedAt: { $exists: false },
          },
        },
      },
    },

    // Modified lookup for messages to correctly count unseen messages
    {
      $lookup: {
        from: 'chatmessages',
        let: { chatId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$chatId', '$$chatId'] },
              sender: { $ne: userObjectId }, // Don't count user's own messages
              seenBy: {
                $not: {
                  $elemMatch: {
                    user: userObjectId,
                  },
                },
              },
            },
          },
          {
            $count: 'unseenCount',
          },
        ],
        as: 'messageStats',
      },
    },

    // Rest of your pipeline remains the same...
    {
      $lookup: {
        from: 'users',
        let: { participants: '$participants' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [
                  '$_id',
                  {
                    $map: {
                      input: '$$participants',
                      as: 'participant',
                      in: '$$participant.user',
                    },
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              profilePic: 1,
            },
          },
        ],
        as: 'participantDetails',
      },
    },

    {
      $lookup: {
        from: 'users',
        let: { senderId: '$lastMessage.sender' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$senderId'] },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'senderDetails',
      },
    },

    {
      $project: {
        _id: 0,
        chatId: '$_id',
        chatType: '$type',
        chatName: {
          $cond: {
            if: { $eq: ['$type', 'group'] },
            then: '$groupName',
            else: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: '$participantDetails',
                        as: 'p',
                        cond: { $ne: ['$$p._id', userObjectId] },
                      },
                    },
                    as: 'filteredParticipant',
                    in: '$$filteredParticipant.name',
                  },
                },
                0,
              ],
            },
          },
        },

        // groupName: {
        //   $cond: {
        //     if: { $eq: ['$type', 'group'] },
        //     then: '$groupName',
        //     else: '$$REMOVE',
        //   },
        // },
        // otherParticipant: {
        //   $cond: {
        //     if: { $eq: ['$type', 'private'] },
        //     then: {
        //       $first: {
        //         $filter: {
        //           input: '$participantDetails',
        //           as: 'p',
        //           cond: { $ne: ['$$p._id', userObjectId] },
        //         },
        //       },
        //     },
        //     else: '$$REMOVE',
        //   },
        // },
        profilePic: {
          $cond: {
            if: { $eq: ['$type', 'private'] },
            then: {
              $let: {
                vars: {
                  otherUser: {
                    $first: {
                      $filter: {
                        input: '$participantDetails',
                        as: 'p',
                        cond: { $ne: ['$$p._id', userObjectId] },
                      },
                    },
                  },
                },
                in: '$$otherUser.profilePic',
              },
            },
            else: '$groupProfilePic',
          },
        },
        lastMessage: '$lastMessage.content',
        lastMessageAt: '$lastMessage.createdAt',
        lastMessageType: '$lastMessage.messageType',
        unseenCount: {
          $ifNull: [{ $first: '$messageStats.unseenCount' }, 0],
        },
        updatedAt: 1,
        lastMessageSentByYou: {
          $eq: ['$lastMessage.sender', userObjectId],
        },
        // participantsCount: { $size: '$participants' },
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'totalCount' }, { $addFields: { page, limit } }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
    {
      $unwind: { path: '$metadata', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        results: '$data',
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalResults: { $ifNull: ['$metadata.totalCount', 0] },
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', '$metadata.limit'] },
        },
      },
    },
  ];

  const response = await Chat.aggregate(pipeline);

  return response.length ? response[0] : { results: [], page: 1, limit, totalResults: 0, totalPages: 0 };
};

export const updateLastMessage = async (chatId: mongoose.Types.ObjectId, message: IMessageDoc) => {
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: {
      content: message.content,
      sender: message.sender,
      createdAt: message.createdAt,
      messageType: message.messageType,
    },
  });
};

export const validateGroupParticipant = async (chatId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) => {
  return await Chat.findOne({
    _id: chatId,
    type: 'group',
    participants: {
      $elemMatch: {
        user: userId,
        removedAt: { $exists: false },
      },
    },
  });
};

export const createMessage = async (chatId: mongoose.Types.ObjectId, senderId: mongoose.Types.ObjectId, payload: any) => {
  return await Message.create({
    chatId,
    sender: senderId,
    ...payload,
    seenBy: [{ user: senderId, seenAt: new Date() }],
  });
};

export const createPrivateChatHelper = async (user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId) => {
  return await Chat.create({
    type: ChatType.Private,
    participants: [
      { user: user1Id, role: 'member', joinedAt: new Date() },
      { user: user2Id, role: 'member', joinedAt: new Date() },
    ],
  });
};

export const findPrivateChat = async (user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId) => {
  return await Chat.findOne({
    type: 'private',
    participants: {
      $all: [
        { $elemMatch: { user: user1Id, removedAt: { $exists: false } } },
        { $elemMatch: { user: user2Id, removedAt: { $exists: false } } },
      ],
    },
  });
};

export const sendGroupMessage = async (
  chatId: mongoose.Types.ObjectId,
  senderId: mongoose.Types.ObjectId,
  payload: string
) => {
  try {
    // Verify chat exists and sender is an active participant
    const chat = await validateGroupParticipant(chatId, senderId);
    if (!chat) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to send messages in this group');
    }

    const message = await createMessage(chatId, senderId, payload);
    await updateLastMessage(chatId, message);

    return message;
  } catch (error) {
    console.log('Error sending group message: ', error);
    throw new ApiError(500, 'Error sending group message');
  }
};

export const sendMessage = async (senderId: mongoose.Types.ObjectId, receiverId: mongoose.Types.ObjectId, payload: any) => {
  try {
    // First try to find an existing private chat between users
    let chat = await findPrivateChat(senderId, receiverId);

    // If no chat exists, create a new one
    if (!chat) {
      chat = await createPrivateChat(senderId, receiverId);
    }

    // Create and save the message
    const message = await createMessage(chat._id, senderId, payload);

    // Update the chat's last message
    await updateLastMessage(chat._id, message);

    return {
      chatId: chat._id,
      message,
    };
  } catch (error) {
    console.log('Error sending message: ', error);
    throw new ApiError(500, 'Error sending message');
  }
};

export const getMessagesByChatId = async (
  userId: mongoose.Types.ObjectId,
  chatId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    {
      $match: {
        _id: chatId,
        participants: {
          $elemMatch: {
            user: userObjectId,
            removedAt: { $exists: false },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'chatmessages',
        let: { chatId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$chatId', '$$chatId'] },
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
          {
            $lookup: {
              from: 'users',
              let: { senderId: '$sender' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$senderId'] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                  },
                },
              ],
              as: 'senderDetails',
            },
          },
          {
            $project: {
              _id: 0,
              messageId: '$_id',
              content: 1,
              sender: {
                $arrayElemAt: ['$senderDetails', 0],
              },
              createdAt: 1,
              messageType: 1,
              seenBy: {
                $filter: {
                  input: '$seenBy',
                  as: 'seen',
                  cond: { $eq: ['$$seen.user', userObjectId] },
                },
              },
            },
          },
        ],
        as: 'messages',
      },
    },
    {
      $project: {
        _id: 0,
        chatId: '$_id',
        messages: 1,
      },
    },
  ];

  const response = await Chat.aggregate(pipeline);

  return response.length ? response[0] : { chatId, messages: [] };
};
