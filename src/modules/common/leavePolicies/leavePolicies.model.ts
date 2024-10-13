import mongoose from 'mongoose';
import { leavePoliciesInterface } from './';
import { toJSON } from '../../../modules/toJSON';

const Schema = mongoose.Schema;

const leaveTypeSchema = new Schema<leavePoliciesInterface.ILeaveTypeDoc, leavePoliciesInterface.ILeaveTypeModel>({
  organizationId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Organization',
  },
  leaveType: {
    type: String,
    required: true,
  },
  isPaid: {
    type: Boolean,
    required: true,
  },
  isEarned: {
    type: Boolean,
    required: true,
    default: false,
  },
  isOperational: {
    type: Boolean,
    required: false,
    default: false,
  },
  policyId: {
    type: Schema.Types.ObjectId,
    ref: 'LeavePolicy',
    default: null,
  },
  unit: {
    type: String,
    required: true,
    enum: leavePoliciesInterface.LeaveUnit,
  },
});

leaveTypeSchema.statics['isLeaveTypeExist'] = async function (leaveType: string, organizationId: string) {
  return !!(await this.findOne({ leaveType, organizationId }));
};

const leavePolicySchema = new Schema<
  leavePoliciesInterface.ILeavePolicyTypeDoc,
  leavePoliciesInterface.ILeavePolicyTypeModel
>({
  leaveTypeId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'LeaveType',
  },
  policyName: {
    type: String,
    required: true,
  },
  policyDescription: {
    type: String,
    required: true,
  },
  policyStartDate: {
    type: String,
    required: true,
  },
  frequencyType: {
    type: String,
    required: true,
    enum: leavePoliciesInterface.FrequencyType,
  },
  frequencyCount: {
    type: Number,
    required: true,
  },
  canCarryForward: {
    type: Boolean,
    required: true,
  },
  leaveExpiryDate: {
    type: Date,
    required: true,
  },
  maxAccrual: {
    type: Number,
    required: true,
  },
  durationType: {
    type: [String],
    required: true,
    enum: leavePoliciesInterface.DurationType,
  },
});

leaveTypeSchema.plugin(toJSON);
leavePolicySchema.plugin(toJSON);

export const LeaveType = mongoose.model<leavePoliciesInterface.ILeaveTypeDoc, leavePoliciesInterface.ILeaveTypeModel>(
  'LeaveType',
  leaveTypeSchema
);

export const LeavePolicy = mongoose.model<
  leavePoliciesInterface.ILeavePolicyTypeDoc,
  leavePoliciesInterface.ILeavePolicyTypeModel
>('LeavePolicy', leavePolicySchema);
