import mongoose, { Document, Model } from 'mongoose';

export enum LeaveUnit {
  Days = 'days',
  Hours = 'hours',
  Minutes = 'minutes',
  Seconds = 'seconds',
  Weeks = 'weeks',
  Months = 'months',
  Years = 'years',
}

export enum FrequencyType {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export enum DurationType {
  Hourly = 'hourly',
  Day = 'day',
  HalfDay = 'halfDay',
}

export interface ILeaveType {
  organizationId: mongoose.Types.ObjectId;
  leaveType: string;
  isPaid: boolean;
  isOperational: boolean;
  policyId: string | null;
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
  durationType: DurationType;
}

export interface ILeaveTypeDoc extends ILeaveType, Document {}

export interface ILeaveTypeModel extends Model<ILeaveTypeDoc> {
  isLeaveTypeExist(leaveType: string, organizationId: mongoose.Types.ObjectId): Promise<boolean>;
}


export interface ILeavePolicyTypeDoc extends ILeavePolicyType, Document {}

export interface ILeavePolicyTypeModel extends Model<ILeavePolicyTypeDoc> {}


export type NewLeaveType = Omit<ILeaveType, 'organizationId' | 'isOperational' | 'policyId'>;
