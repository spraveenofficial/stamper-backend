import Joi from 'joi';
// import { NewMessageType } from './chat.interfaces';
import { objectId } from '../validate';

const createChatBody: any = {
    content: Joi.string().required(),
    type: Joi.string().required(),
    to: Joi.string().optional().custom(objectId),
    groupId: Joi.string().optional().custom(objectId),
}

export const createChatRequest = {
    body: Joi.object().keys(createChatBody),
};

