import Joi from 'joi';
import { NewDepartmentType } from './departments.interfaces';
import { objectId } from '../validate';

const createDepartmentBody: Record<keyof NewDepartmentType, any> = {
  title: Joi.string().required(),
  description: Joi.string().required(),
  officeId: Joi.string().custom(objectId),
};

export const createDepartmentRequest = {
  body: Joi.object().keys(createDepartmentBody),
};
