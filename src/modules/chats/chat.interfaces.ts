import mongoose, { Document } from 'mongoose';
import { Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
  FILE = "FILE",
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  LAUGH = 'LAUGH',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
}

export interface IMessage {
  chatId: mongoose.Types.ObjectId | null; // Chat or Group reference (use null for invalid reference)
  from: mongoose.Types.ObjectId; // Sender ID
  to: mongoose.Types.ObjectId | null; // Receiver ID (null if group chat)
  type: MessageType; // Message type
  content: string; // Message text or media URL
  seen: boolean; // Indicates if the message has been seen
  seenAt: Date | null; // Timestamp of when the message was seen
  reaction: Array<{ user: mongoose.Types.ObjectId, type: ReactionType }>;
  deletedAt: Date | null; // Timestamp of deletion (null if not deleted)
  createdAt: Date; // Timestamp of message creation
  updatedAt: Date; // Timestamp of last update
}

export interface IMessageDoc extends IMessage, Document {}

export interface IMessageModel extends Model<IMessageDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type NewMessageType = Omit<IMessage, 'from' | 'seen' | 'seenAt' | 'reaction' | 'deletedAt'>;