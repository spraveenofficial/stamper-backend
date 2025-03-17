import Joi from 'joi';
import { NewDocumentType } from './documents.interfaces';

const createNewFolderBody: Record<keyof NewDocumentType, any> = {
  _id: Joi.string().optional(),
  folderName: Joi.string().required(),
  description: Joi.string().required(),
  access: Joi.array().items(Joi.string()).required(),
  employees: Joi.array().items(
    Joi.object({
      _id: Joi.string().required(), 
      email: Joi.string().email().required() 
    })
  ).optional(),
  departmentId: Joi.string().optional()
};

export const createNewFolderRequest = {
  body: Joi.object().keys(createNewFolderBody),
};
