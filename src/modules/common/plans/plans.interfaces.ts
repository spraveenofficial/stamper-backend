import mongoose, { Document, Model } from 'mongoose';

export enum SubscriptionPlanEnum {
  FREE = 'Free',
  BASIC = 'Basic',
  PRO = 'Pro',
}

export enum SubscriptionPlanDurationEnum {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  DAYS = 'DAYS',
}

export enum PlanPriceCurrencyEnum {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  INR = 'INR',
}

export interface IPlansFeatures {
  featureName: string;
  isAvailable: boolean;
}

export interface IPlans {
  planName: string;
  planDescription: string;
  planPrice: number;
  planPriceCurrency: PlanPriceCurrencyEnum;
  planDuration: number;
  planDurationUnit: SubscriptionPlanDurationEnum;
  isActive: boolean;
  planType: string;
  planFeatures: IPlansFeatures[];
  isRecommended: boolean;
  isPopular: boolean;
  isCancelable: boolean;
  isRefundable: boolean;
  addedBy: mongoose.Schema.Types.ObjectId;
}

export interface IPlansDoc extends IPlans, Document { }
export interface IPlansModel extends Model<IPlansDoc> { }


export interface IPlansFeaturesDoc extends IPlansFeatures, Document { }
export interface IPlansFeaturesModel extends Model<IPlansFeaturesDoc> { }

export type NewPlanPayload = Omit<IPlans, 'addedBy'>;
