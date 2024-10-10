import Joi from 'joi';
import { objectId } from '../validate';
import { LeaveStatus } from './leave.interfaces';
import { leavePoliciesInterface } from '../common/leavePolicies';

const createLeaveTypeBody: Record<keyof leavePoliciesInterface.NewLeaveType, any> = {
  leaveType: Joi.string().required(),
  isPaid: Joi.boolean().required(),
  unit: Joi.string().valid(...Object.values(leavePoliciesInterface.LeaveUnit)).required(),
};

const createLeaveTypePolicyBody: Record<keyof leavePoliciesInterface.ILeavePolicyType, any> = {
  leaveTypeId: Joi.string().custom(objectId),
  policyName: Joi.string().required(),
  policyDescription: Joi.string().required(),
  policyStartDate: Joi.string().required(),
  frequencyType: Joi.string().required(),
  canCarryForward: Joi.boolean().required(),
  leaveExpiryDate: Joi.date().required(),
  maxAccrual: Joi.number().required(),
  durationType: Joi.string().required(),
  frequencyCount: Joi.number().required(),
};


export const createLeaveType = {
  body: Joi.object().keys(createLeaveTypeBody),
};

export const createLeaveTypePolicy = {
  body: Joi.object().keys(createLeaveTypePolicyBody),
};

const createLeaveBody = {
  leaveType: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  total: Joi.number().required(),
  attachment: Joi.string().optional(),
  note: Joi.string().optional(),
};

export const createLeave = {
  body: Joi.object().keys(createLeaveBody),
};

export const updateLeave = {
  params: Joi.object().keys({
    leaveId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys(createLeaveBody),
};

export const updateLeaveStatus = {
  body: Joi.object().keys({
    status: Joi.string()
      .valid(...Object.values(LeaveStatus))
      .required(),
    leaveId: Joi.string().custom(objectId),
  }),
};
