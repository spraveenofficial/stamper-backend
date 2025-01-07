import mongoose from 'mongoose';
import { toJSON } from '../../../modules/toJSON';
import { IPlansDoc, IPlansModel, PlanPriceCurrencyEnum, SubscriptionPlanDurationEnum } from './plans.interfaces';

const Schema = mongoose.Schema;

const planSchema = new Schema<IPlansDoc, IPlansModel>(
  {
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planDescription: {
      type: String,
      required: true,
      trim: true,
    },
    planPrice: {
      type: Number,
      required: true,
    },
    planPriceCurrency: {
      type: String,
      enum: Object.values(PlanPriceCurrencyEnum),
      required: true,
    },
    planDuration: {
      type: Number,
      required: true,
    },
    planDurationUnit: {
      type: String,
      enum: Object.values(SubscriptionPlanDurationEnum),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    planType: {
      type: String,
      required: true,
    },
    planFeatures: {
      type: [String],
      required: true,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.plugin(toJSON);

const Plan = mongoose.model<IPlansDoc, IPlansModel>('Plans', planSchema);

export default Plan;
