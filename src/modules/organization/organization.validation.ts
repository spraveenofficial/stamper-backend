import Joi from 'joi';
import { NewCreateOrganization } from './organization.interfaces';
import { employeeValidation } from '../employee';
import { NewUserAsEmployee } from '../user/user.interfaces';

export const organizationRegisterBody: Record<keyof NewCreateOrganization, any> = {
  companyDomainName: Joi.string().required(),
  companyName: Joi.string().required(),
  companySize: Joi.string().required(),
  industryType: Joi.string().required(),
  companyRole: Joi.string().required(),
  needs: Joi.string().required(),
};

export const addUserAsEmployeeBody : Record<keyof NewUserAsEmployee, any> = {
  name: Joi.string().required(),
  email: Joi.string().required(),
  phoneNumber: Joi.string().optional(),
}

export const addEmployeeBody = {
  user: addUserAsEmployeeBody,
  employeeInformation: employeeValidation.employeeRegisterBody,
};

export const addEmployee = {
  body: Joi.object().keys(addEmployeeBody),
};