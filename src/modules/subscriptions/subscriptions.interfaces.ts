import mongoose, { Document, Model } from 'mongoose';

export enum SubscriptionStatusEnum {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
}

export interface ISubscription {
  userId: string;
  organizationId: string;
  planId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatusEnum;
  paymentId: string;
  isRecurring: boolean;
}

export interface ISubscriptionDoc extends ISubscription, Document {}

export interface ISubscriptionModel extends Model<ISubscriptionDoc> {
  isSubscriptionExist(userId: mongoose.Types.ObjectId): Promise<boolean>;
}
