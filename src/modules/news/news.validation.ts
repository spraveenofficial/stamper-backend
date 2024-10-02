import Joi from 'joi';
import { NewNewsType } from './news.interfaces';

const createNewNews: Record<keyof NewNewsType, any> = {
  title: Joi.string().required(),
  content: Joi.string().required(),
  status: Joi.string().valid('draft', 'published', 'archived', 'scheduled').required(),
  access: Joi.array().items(Joi.string().valid('employee', 'organization')).default(['employee', 'organization']),
  scheduledAt: Joi.date().optional(),
};

export const createNewNewsBody = {
  body: Joi.object().keys(createNewNews),
};
