import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import {
  ChatType,
  GroupParticipantRole,
  IChatDoc,
  IChatModel,
  IMessageDoc,
  IMessageModel,
  MessageType,
} from './chat.interfaces';

const { Schema } = mongoose;

const MessageSchema = new Schema<IMessageDoc, IMessageModel>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messageType: { type: String, required: true, enum: Object.values(MessageType) },
    content: { type: String, required: true },
    seenBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        seenAt: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        reaction: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

MessageSchema.plugin(toJSON);
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export const Message = mongoose.model<IMessageDoc, IMessageModel>('ChatMessage', MessageSchema);

const ParticipantSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: Object.values(GroupParticipantRole), default: GroupParticipantRole.Member },
  joinedAt: { type: Date, default: Date.now },
  removedAt: { type: Date },
});

ParticipantSchema.plugin(toJSON);

const ChatSchema = new Schema<IChatDoc, IChatModel>(
  {
    type: {
      type: String,
      enum: Object.values(ChatType),
      required: true,
    },
    participants: [ParticipantSchema],
    groupName: { type: String },
    groupProfilePic: { type: String, default: null },
    groupDescription: { type: String },
    lastMessage: {
      content: String,
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
      messageType: { type: String, enum: Object.values(MessageType) },
    },
  },
  {
    timestamps: true,
  }
);

ChatSchema.plugin(toJSON);

// Indexes for better query performance
ChatSchema.index({ 'participants.user': 1 });
ChatSchema.index({ updatedAt: -1 });
ChatSchema.index({ type: 1 });

export const Chat = mongoose.model<IChatDoc, IChatModel>('ChatConversations', ChatSchema);
