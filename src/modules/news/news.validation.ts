import Joi from 'joi';
import { NewNewsType } from './news.interfaces';
import { objectId } from '../validate';

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


export const getNewsByIdParams = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
}

export const updateNewsByIdParams = {
  params: Joi.object().keys({
    id: Joi.required(),
  }),
  body: Joi.object().keys(createNewNews),
};