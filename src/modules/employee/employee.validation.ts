import Joi from 'joi';

export const employeeRegisterBody = {
  jobTitle: Joi.string().required(),
  department: Joi.string().required(),
  office: Joi.string().required(),
  joiningDate: Joi.date().required(),
};
