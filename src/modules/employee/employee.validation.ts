import Joi from 'joi';
import { password } from '../validate';

export const employeeRegisterBody = {
  jobTitle: Joi.string().required(),
  department: Joi.string().required(),
  office: Joi.string().required(),
  joiningDate: Joi.date().required(),
};


export const acceptInvitation = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};
