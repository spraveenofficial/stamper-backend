import Joi from 'joi';
import { NewAddOffice, UpdateOffice } from './office.interfaces';

const createOfficeBody: Record<keyof NewAddOffice, any> = {
  name: Joi.string().required(),
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
  location: Joi.string().optional(),
  capacity: Joi.string().optional(),
  isOperational: Joi.boolean().optional(),
//   isHeadQuarter: Joi.boolean().optional(),
  contactNumber: Joi.string().optional(),
  contactEmail: Joi.string().optional(),
  companyOverview: Joi.string().optional(),
};

export const creatOfficeRequest = {
  body: Joi.object().keys(createOfficeBody),
};

export const editOfficeRequest = {
    body: Joi.object().keys(updateOfficeBody),
}
