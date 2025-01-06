import { Document, Model } from 'mongoose';

export enum SubscriptionPlanEnum {
  FREE = 'Free',
  BASIC = 'Basic',
  PRO = 'Pro',
}

export interface IPlans {
  planName: string;
  planDescription: string;
  planPrice: number;
  planPriceCurrency: string;
  planDuration: number;
  planDurationUnit: string;
  isActive: boolean;
  planType: string;
  planFeatures: string[];
  isRecommended: boolean;
  isPopular: boolean;
}

export interface IPlansDoc extends IPlans, Document {}

export interface IPlansModel extends Model<IPlansDoc> {}
