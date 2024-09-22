import mongoose, { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export enum NotificationTypes {
  LEAVE_REQUEST = 'leave-request',
  LEAVE_REQUEST_APPROVED = 'leave-request-approved',
  LEAVE_REQUEST_REJECTED = 'leave-request-rejected',
  LEAVE_REQUEST_CANCELLED = 'leave-request-cancelled',
}

export interface INotification {
  to: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  message: string;
  seen: boolean;
  url: string;
  type: NotificationTypes;
}

export interface INotificationDoc extends INotification, Document {}

export interface INotificationModel extends Model<INotificationDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}
