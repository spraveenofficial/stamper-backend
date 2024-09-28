import Joi from 'joi';
import { NewDocumentType } from './documents.interfaces';

const createNewFolderBody: Record<keyof NewDocumentType, any> = {
  folderName: Joi.string().required(),
  description: Joi.string().required(),
  access: Joi.array().items(Joi.string()).required(),
};

export const createNewFolderRequest = {
  body: Joi.object().keys(createNewFolderBody),
};
