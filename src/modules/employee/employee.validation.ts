import Joi from 'joi';
import { objectId, password } from '../validate';
import { employeeAccountStatus, employeeStatus, NewEmployee } from './employee.interfaces';

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


export const getEmployeeRequestValidation = {
  query: Joi.object().keys({
    limit: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.integer': 'Limit must be an integer',
      }), // Optional limit, must be an integer, default to 10
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1',
        'number.integer': 'Page must be an integer',
      }), // Optional page, must be an integer, default to 1
    officeId: Joi.string()
      .custom(objectId)
      .optional()
      .allow(null, '')
      .messages({
        'string.base': 'Office ID must be a valid string',
        'any.custom': 'Office ID must be a valid ObjectId',
      }), // Optional officeId, string or null/empty
    accountStatus: Joi.string()
      .valid(...Object.values(employeeAccountStatus))
      .optional()
      .messages({
        'any.only': `Account status must be one of: ${Object.values(employeeAccountStatus).join(', ')}`,
      }), // Optional accountStatus, should match valid enum values
    employeeStatus: Joi.string()
      .valid(...Object.values(employeeStatus))
      .optional()
      .messages({
        'any.only': `Employee status must be one of: ${Object.values(employeeStatus).join(', ')}`,
      }), // Optional employeeStatus, should match valid enum values
    name: Joi.string()
      .optional()
      .allow(null, '')
      .max(100)
      .messages({
        'string.base': 'Name must be a string',
        'string.max': 'Name cannot be longer than 100 characters',
      }), // Optional name filter, max length of 100 characters, allow empty
  }),
};


export const employeeInformationRequestValidation = {
  params: Joi.object().keys({
    id: Joi.string().required()
  }),
};