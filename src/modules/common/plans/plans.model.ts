import { toJSON } from '@/modules/toJSON';
import mongoose from 'mongoose';
import { IPlansDoc, IPlansModel } from './plans.interfaces';

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
      required: true,
    },
    planDuration: {
      type: Number,
      required: true,
    },
    planDurationUnit: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

planSchema.plugin(toJSON);

const Plan = mongoose.model<IPlansDoc, IPlansModel>('Plans', planSchema);

export default Plan;
