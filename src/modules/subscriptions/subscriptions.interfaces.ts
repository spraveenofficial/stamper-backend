import mongoose, { Document, Model } from 'mongoose';

export enum SubscriptionStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface ISubscription {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatusEnum;
  paymentId: mongoose.Types.ObjectId | null;
  isRecurring: boolean;
}

export interface ISubscriptionDoc extends ISubscription, Document { }

export interface ISubscriptionModel extends Model<ISubscriptionDoc> {
  isSubscriptionExist(userId: mongoose.Types.ObjectId): Promise<boolean>;
}
