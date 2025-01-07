import mongoose, { Document, Model } from 'mongoose';

export enum SubscriptionPlanEnum {
  FREE = 'Free',
  BASIC = 'Basic',
  PRO = 'Pro',
}

export enum SubscriptionPlanDurationEnum {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PlanPriceCurrencyEnum {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  INR = 'INR',
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
  planFeatures: string[];
  isRecommended: boolean;
  isPopular: boolean;
  addedBy: mongoose.Schema.Types.ObjectId;
}

export interface IPlansDoc extends IPlans, Document { }

export interface IPlansModel extends Model<IPlansDoc> { }

export type NewPlanPayload = Omit<IPlans, 'addedBy'>;
