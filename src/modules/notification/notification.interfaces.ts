import mongoose, { Model } from 'mongoose';

export interface INotification {
  to: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  message: string;
  seen: boolean;
  url: string;
  type: string;
}

export interface INotificationDoc extends INotification, Document {}

export interface INotificationModel extends Model<INotificationDoc> {

  }