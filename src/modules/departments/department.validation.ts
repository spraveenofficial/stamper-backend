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


const getDepartmentsQuery = {
  officeId: Joi.string().custom(objectId).required(), // Ensure officeId is compulsory
};

export const getDepartmentsRequest = {
  query: Joi.object(getDepartmentsQuery).required(), // Make the query object itself compulsory
};
