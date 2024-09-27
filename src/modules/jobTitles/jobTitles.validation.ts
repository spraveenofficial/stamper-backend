import Joi from 'joi';
import { NewJobTitleType } from './jobTitles.interfaces';
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
