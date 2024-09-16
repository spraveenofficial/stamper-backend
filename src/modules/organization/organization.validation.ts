import Joi from 'joi';
import { NewCreateOrganization } from './organization.interfaces';
import { employeeValidation } from '../employee';
import { registerBody } from '../auth/auth.validation';

export const organizationRegisterBody: Record<keyof NewCreateOrganization, any> = {
  companyDomainName: Joi.string().required(),
  companyName: Joi.string().required(),
  companySize: Joi.string().required(),
  industryType: Joi.string().required(),
  companyRole: Joi.string().required(),
  needs: Joi.string().required(),
};

export const addEmployeeBody = {
  user: registerBody,
  employeeInformation: employeeValidation.employeeRegisterBody,
};

export const addEmployee = {
  body: Joi.object().keys(addEmployeeBody),
};
