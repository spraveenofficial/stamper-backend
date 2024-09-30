import Joi from 'joi';
import { objectId, password } from '../validate';
import { NewEmployee } from './employee.interfaces';

export const employeeRegisterBody: Record<keyof NewEmployee, any> = {
  jobTitleId: Joi.string().required().custom(objectId),
  departmentId: Joi.string().required().custom(objectId),
  officeId: Joi.string().required().custom(objectId),
  joiningDate: Joi.date().required(),
};

const employeeReinviteBody = {
  email: Joi.string().email().required(),
};


export const acceptInvitation = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

export const reinviteEmployee = {
  body: Joi.object().keys(employeeReinviteBody),
};
