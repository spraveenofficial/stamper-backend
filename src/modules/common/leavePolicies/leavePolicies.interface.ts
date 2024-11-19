import mongoose, { Document, Model } from 'mongoose';

export enum LeaveUnit {
  Days = 'days',
  HalfDay = 'halfDay',
}

export enum FrequencyType {
  Yearly = 'yearly',
}

export enum DurationType {
  Day = 'day',
  HalfDay = 'halfDay',
}

export interface ILeaveType {
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  leaveType: string;
  isPaid: boolean;
  isEarned: boolean;
  isOperational: boolean;
  policyId: mongoose.Types.ObjectId | null;
  unit: LeaveUnit;
}

export interface ILeavePolicyType {
  leaveTypeId: mongoose.Types.ObjectId;
  policyName: string;
  policyDescription: string;
  policyStartDate: string;
  frequencyType: FrequencyType;
  frequencyCount: number;
  canCarryForward: boolean;
  leaveExpiryDate: Date;
  maxAccrual: number;
  durationType: DurationType[];
}

export interface ILeaveTypeDoc extends ILeaveType, Document {}

export interface ILeaveTypeModel extends Model<ILeaveTypeDoc> {
  isLeaveTypeExist(leaveType: string, organizationId: mongoose.Types.ObjectId, officeId: mongoose.Types.ObjectId): Promise<boolean>;
}

export interface ILeavePolicyTypeDoc extends ILeavePolicyType, Document {}

export interface ILeavePolicyTypeModel extends Model<ILeavePolicyTypeDoc> {}

export type NewLeaveType = Omit<ILeaveType, 'organizationId' | 'isOperational' | 'policyId'>;
