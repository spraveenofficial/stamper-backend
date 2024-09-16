import Joi from 'joi';
import { objectId } from '../validate';
import { LeaveStatus } from './leave.interfaces';

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
    status: Joi.string().valid(...Object.values(LeaveStatus)).required(),
    leaveId: Joi.string().custom(objectId),
  }),
};
