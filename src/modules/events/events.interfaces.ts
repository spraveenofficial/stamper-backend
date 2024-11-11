import mongoose, { Document } from 'mongoose';

export enum EventStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  MAYBE = 'MAYBE',
}

export enum EventType {
  RESERVE = "RESERVE",
  ONLEAVE = "ONLEAVE",
  ONHOLIDAY = "ONHOLIDAY",
}

export interface IEventGuests {
  userId: mongoose.Types.ObjectId;
  status?: EventStatus;
}

export interface IEvent {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: EventType;
  description: string;
  date: Date;
  startTime: String;
  endTime: String;
  timeZone: string | null;
  link: string | null;
  location: string | null;
  guests: IEventGuests[];
  note: string | null;
}

export interface IEventGuestsDoc extends IEventGuests, Document {}
export interface IEventGuestsModel extends IEvent, Document {}

export interface IEventDoc extends IEvent, Document {}

export interface IEventModel extends mongoose.Model<IEventDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<any>;
}

export type NewEvent = Omit<IEvent, 'userId' | 'type'>;