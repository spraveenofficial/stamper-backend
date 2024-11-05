import Joi from 'joi';
import { objectId } from '../validate';
import { LeaveStatus, NewLeave } from './leave.interfaces';
import { leavePoliciesInterface } from '../common/leavePolicies';
import { officeHolidayInterfaces } from '../common/officeHolidays';

const createLeaveTypeBody: Record<keyof leavePoliciesInterface.NewLeaveType, any> = {
  leaveType: Joi.string().required(),
  isPaid: Joi.boolean().required(),
  unit: Joi.string()
    .valid(...Object.values(leavePoliciesInterface.LeaveUnit))
    .required(),
  isEarned: Joi.boolean().optional(),
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
  durationType: Joi.array()
    .items(Joi.string().valid(...Object.values(leavePoliciesInterface.DurationType)))
    .required(),
  frequencyCount: Joi.number().required(),
};

const createHolidayBody: Record<keyof officeHolidayInterfaces.NewHolidayPayloadType, any> = {
  officeId: Joi.string().custom(objectId).required(),
  financialYear: Joi.number().required(),
  holidayList: Joi.array().items(
    Joi.object().keys({
      date: Joi.date().required(),
      description: Joi.string().required(),
      note: Joi.string().allow(null).optional()
    }),
  ),
}

export const createLeaveType = {
  body: Joi.object().keys(createLeaveTypeBody),
};

export const createLeaveTypePolicy = {
  body: Joi.object().keys(createLeaveTypePolicyBody),
};

const createLeaveBody: Record<keyof NewLeave, any> = {
  leaveTypeId: Joi.string().custom(objectId).required(),
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

export const addHoliday = {
  body: Joi.object().keys(createHolidayBody),
}

export const updateLeaveStatus = {
  body: Joi.object().keys({
    status: Joi.string()
      .valid(...Object.values(LeaveStatus))
      .required(),
    leaveId: Joi.string().custom(objectId),
  }),
};
