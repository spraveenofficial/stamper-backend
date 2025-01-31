import Joi from 'joi';
import { NewAddOffice, UpdateOffice } from './office.interfaces';

const createOfficeBody: Record<keyof NewAddOffice, any> = {
  name: Joi.string().required(),
  timezone: Joi.string().required(),
  location: Joi.string().required(),
  capacity: Joi.string().required(),
  isHeadQuarter: Joi.boolean().required(),
  contactNumber: Joi.string().required(),
  contactEmail: Joi.string().required(),
  companyOverview: Joi.string().optional(),
};

const updateOfficeBody: Record<keyof UpdateOffice, any> = {
  officeId: Joi.string().required(),
  name: Joi.string().optional(),
  timezone: Joi.string().optional(),
  location: Joi.string().optional(),
  capacity: Joi.string().optional(),
  isOperational: Joi.boolean().optional(),
  contactNumber: Joi.string().optional(),
  contactEmail: Joi.string().optional(),
  companyOverview: Joi.string().optional(),
  attendanceConfig: Joi.object({
    totalHoursCalculation: Joi.string().required(), // Add other options if needed
    attendanceApprovalCycle: Joi.object({}).keys({
      startDay: Joi.alternatives()
        .try(
          Joi.number().integer().min(1).max(31), // Day of the month (1-31)
          Joi.string().valid('last') // 'last' for the last day of the month
        )
        .required(),
      frequency: Joi.string().valid('Monthly', 'Weekly').required(), // Repeat On
    }).required(),
  }).optional(),
};

export const creatOfficeRequest = {
  body: Joi.object().keys(createOfficeBody),
};

export const editOfficeRequest = {
  body: Joi.object().keys(updateOfficeBody),
};
