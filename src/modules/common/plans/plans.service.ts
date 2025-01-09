import mongoose from 'mongoose';
import { IPlansDoc, NewPlanPayload } from './plans.interfaces';
import Plan from './plans.model';

export const createPlan = async (payload: NewPlanPayload, addedBy: mongoose.Schema.Types.ObjectId): Promise<IPlansDoc> => {
  return Plan.create({ ...payload, addedBy });
};

export const getPlansToDisplay = async (planType?: string): Promise<IPlansDoc[]> => {
  const query = planType ? { isActive: true, planDurationUnit: planType } : { isActive: true };

  const data = await Plan.find(query).sort({ createdAt: -1 }).select('-addedBy -planFeatures._id -__v').lean();

  const formattedPlans = data?.map((plan: any) => {
    plan.planId = plan._id; // Rename _id to planId
    delete plan._id; // Remove the original _id field
    delete plan.createdAt;
    delete plan.updatedAt;
    delete plan.isActive;
    return plan;
  });

  return formattedPlans;
};

export const getPlanById = async (planId: string): Promise<IPlansDoc | null> => {
  return Plan.findById(planId).select('-addedBy').lean();
};


export const getTrailPlan = async (): Promise<IPlansDoc | null> => {
  return Plan.findOne({ planName: "Trail" }).select('-addedBy').lean();
};