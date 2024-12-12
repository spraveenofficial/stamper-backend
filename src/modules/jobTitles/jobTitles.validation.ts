import Joi from 'joi';
import { NewJobTitleType, UpdateJobTitleType } from './jobTitles.interfaces';
import { objectId } from '../validate';

const createJobTitleBody: Record<keyof NewJobTitleType, any> = {
  jobTitle: Joi.string().required(),
  jobTitleDescription: Joi.string().required(),
  departmentId: Joi.string().required(),
  officeId: Joi.string().custom(objectId),
};

export const createJobTitleRequest = {
  body: Joi.object().keys(createJobTitleBody),
};


const updateJobTitleBody : Record<keyof UpdateJobTitleType, any> = {
  jobTitleId: Joi.string().custom(objectId).required(),
  jobTitle: Joi.string().optional(),
  jobTitleDescription: Joi.string().optional(),
  departmentId: Joi.string().optional(),
  officeId: Joi.string().custom(objectId).optional(),
  managerId: Joi.string().custom(objectId).optional(),
  isOperational: Joi.boolean().optional(),
  organizationId: Joi.string().custom(objectId).optional(),
}

export const updateJobTitleRequest = {
  body: Joi.object().keys(updateJobTitleBody),
}