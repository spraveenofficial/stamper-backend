import Joi from 'joi';
import { password, objectId } from '../validate/custom.validation';
import { NewCreatedUser } from './user.interfaces';

const createUserBody: Record<keyof NewCreatedUser, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  role: Joi.string().required().valid('organization', 'employee'),
};

export const createUser = {
  body: Joi.object().keys(createUserBody),
};

export const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateUser = {
  body: Joi.object()
    .keys({
      name: Joi.string(),
    })
    .min(1),
};

export const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateProfilePicture = {
  // body: Joi.object().keys({
  //   file: Joi.string().required(),
  // }),
};

const changePasswordBody = {
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required().custom(password),
};

export const changePassword = {
  body: Joi.object().keys(changePasswordBody),
};
