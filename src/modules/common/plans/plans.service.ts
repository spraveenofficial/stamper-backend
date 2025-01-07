import mongoose from 'mongoose';
import { IPlansDoc, NewPlanPayload } from './plans.interfaces';
import Plan from './plans.model';

export const createPlan = async (payload: NewPlanPayload, addedBy: mongoose.Schema.Types.ObjectId): Promise<IPlansDoc> => {
  return Plan.create({ ...payload, addedBy });
};

export const getPlansToDisplay = async (): Promise<IPlansDoc[]> => {
  return Plan.find({ isActive: true }).sort({ createdAt: -1 });
};
