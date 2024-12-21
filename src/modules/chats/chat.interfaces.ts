import mongoose, { Document } from "mongoose";
import { Model } from "mongoose";
import { QueryResult } from "../paginate/paginate";

export enum MessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    AUDIO = "AUDIO"
}
export interface IMessage {
    from: mongoose.Types.ObjectId,
    to: mongoose.Types.ObjectId,
    type: MessageType,
    content: string,
    seen: boolean,
    seenAt: Date |null,
    reaction: string |null,
    deletedAt: Date |null
}
export interface IMessageDoc extends IMessage, Document {}

export interface IMessageModel extends Model<IMessageDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
  
}

export type NewMessageType =Omit<IMessage,"from"| "seen" | "seenAt"|"reaction"|"deletedAt" >
