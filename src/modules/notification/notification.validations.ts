import Joi from 'joi';
import { objectId } from '../validate';

export const markNotificationAsSeen = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};
