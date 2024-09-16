import Joi from 'joi';

export const employeeRegisterBody = {
  jobTitle: Joi.string().required(),
  department: Joi.string().required(),
  office: Joi.string().required(),
  employeeStatus: Joi.string().required(),
  accountStatus: Joi.string().required(),
};
