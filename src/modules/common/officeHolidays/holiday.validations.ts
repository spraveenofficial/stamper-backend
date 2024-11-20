import Joi from 'joi';
import { NewHolidayPayloadType, UpdateHolidayPayloadType } from './holidays.interfaces';
import { objectId } from '../../../modules/validate';

const createHolidayBody: Record<keyof NewHolidayPayloadType, any> = {
  officeId: Joi.string().required().messages({
    'string.base': '"officeId" must be a string',
    'any.required': '"officeId" is required',
  }),
  financialYear: Joi.number().required().messages({
    'number.base': '"financialYear" must be a number',
    'any.required': '"financialYear" is required',
  }),
  holidayList: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required().messages({
          'string.base': '"description" must be a string',
          'any.required': '"description" is required',
        }),
        date: Joi.string()
          .required()
          .custom((value, helpers) => {
            // Access the financialYear directly from the context
            const financialYear = helpers.state.ancestors[2]?.financialYear;

            const date = new Date(value); // Parse date correctly
            const dateYear = date.getFullYear();

            // Check if the date year matches the financial year
            if (dateYear !== financialYear) {
              return helpers.error('any.invalid', {
                value,
                message: `"date" must match the financial year ${financialYear}`,
              });
            }
            return value;
          }, 'Check if date matches financial year')
          .messages({
            'string.base': '"date" must be a string in valid date format',
            'any.required': '"date" is required',
            'any.invalid': '"date" must match the financial year',
          }),
        note: Joi.string().allow(null).messages({
          'string.base': '"note" must be a string or null',
        }),
      })
    )
    .required()
    .messages({
      'array.base': '"holidayList" must be an array',
      'any.required': '"holidayList" is required',
    }),
};

export const createHoliday = {
  body: Joi.object(createHolidayBody).messages({
    'object.base': 'The request body must be an object',
    'any.required': 'The body is required',
  }),
};

const updateHoliday: Record<keyof UpdateHolidayPayloadType, any> = {
  financialYear: Joi.number().required().messages({
    'number.base': '"financialYear" must be a number',
    'any.required': '"financialYear" is required',
  }),
  holidayList: Joi.array()
    .items(
      Joi.object({
        holidayId: Joi.string().optional(),
        description: Joi.string().required().messages({
          'string.base': '"description" must be a string',
          'any.required': '"description" is required',
        }),
        date: Joi.string()
          .required()
          .custom((value, helpers) => {
            // Access the financialYear directly from the context
            const financialYear = helpers.state.ancestors[2]?.financialYear;

            const date = new Date(value); // Parse date correctly
            const dateYear = date.getFullYear();

            // Check if the date year matches the financial year
            if (dateYear !== financialYear) {
              return helpers.error('any.invalid', {
                value,
                message: `"date" must match the financial year ${financialYear}`,
              });
            }
            return value;
          }, 'Check if date matches financial year')
          .messages({
            'string.base': '"date" must be a string in valid date format',
            'any.required': '"date" is required',
            'any.invalid': '"date" must match the financial year',
          }),
        note: Joi.string().allow(null).messages({
          'string.base': '"note" must be a string or null',
        }),
      })
    )
    .required()
    .messages({
      'array.base': '"holidayList" must be an array',
      'any.required': '"holidayList" is required',
    }),
};

export const updateHolidayRequest = {
  params: Joi.object({
    holidayId: Joi.string().custom(objectId).required().messages({
      'string.base': '"holidayId" must be a string',
      'any.required': '"holidayId" is required',
    }),
  }),
  body: Joi.object(updateHoliday).messages({
    'object.base': 'The request body must be an object',
    'any.required': 'The body is required',
  }),
};
