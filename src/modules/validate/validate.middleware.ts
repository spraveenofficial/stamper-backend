import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../errors/ApiError';

const validate =
  (schema: Record<string, any>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));

    // Validate the object
    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' } })
      .validate(object);

    if (error) {
      // Translate Joi error messages using req.t
      const errorMessage = error.details
        .map((details) => {
          const fieldName = details.context?.label || details.context?.key;

          // Handle custom MongoDB ObjectId invalid error
          if (details.message.includes('must be a valid mongo id')) {
            return req.t('validation.objectIdInvalid', { field: fieldName });
          }

          // Handle other validation errors
          return req.t('validation.' + details.type, {
            field: fieldName,
            ...details.context,
          });
        })
        .join(', ');

      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    Object.assign(req, value);
    return next();
  };

export default validate;

