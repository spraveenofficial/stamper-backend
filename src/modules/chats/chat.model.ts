import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { IMessageDoc, IMessageModel, MessageType, ReactionType } from './chat.interfaces';

const messageSchema = new mongoose.Schema<IMessageDoc, IMessageModel>(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: false,
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true,
      default: MessageType.TEXT,
    },
    content: {
      type: String,
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
    reaction: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: Object.values(ReactionType) },
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
messageSchema.plugin(toJSON);
const Message = mongoose.model<IMessageDoc, IMessageModel>('Messages', messageSchema);

export default Message;
