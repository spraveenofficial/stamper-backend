import mongoose, { Document, Model } from 'mongoose';

export enum MessageType {
    Text = 'TEXT',
    Image = 'IMAGE',
    Video = 'VIDEO',
    Audio = 'AUDIO',
    File = 'FILE',
    Log = 'LOG',
}

export enum GroupParticipantRole {
  Admin = 'admin',
  Member = 'member',
}

export enum ChatType {
  Private = 'private',
  Group = 'group',
}

interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: MessageType;
  seenBy: Array<{
    user: mongoose.Types.ObjectId;
    seenAt: Date;
  }>;
  reactions: Array<{
    user: mongoose.Types.ObjectId;
    reaction: string;
  }>;
}

interface IParticipant {
  user: mongoose.Types.ObjectId;
  role: GroupParticipantRole;
  joinedAt: Date;
  removedAt?: Date;
}

export interface IChat extends Document {
  type: ChatType;
  participants: IParticipant[];
  groupName?: string;
  groupProfilePic?: string;
  groupDescription?: string;
  lastMessage?: {
    content: string;
    sender: mongoose.Types.ObjectId;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatDoc extends IChat, Document {}
export interface IChatModel extends Model<IChatDoc> {}


export interface IMessageDoc extends IMessage, Document {
    createdAt: Date;
}
export interface IMessageModel extends Model<IMessageDoc> {}