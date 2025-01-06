import mongoose, { Document, Model } from 'mongoose';

export interface ICapLimits {
  organizationId: mongoose.Types.ObjectId;
  addOffice: number;
  addDepartment: number;
  addJobTitle: number;
  addEmployee: number;
  addManager: number;
  addFolder: number;
  addDocument: number;
  canSubscribeToPlan: boolean;
}

export interface ICapLimitsDoc extends ICapLimits, Document { }

export interface ICapLimitsModel extends Model<ICapLimitsDoc> {
  isCapLimitExist(userId: mongoose.Types.ObjectId): Promise<boolean>;
}

export type NewUserCap = Partial<ICapLimits>;