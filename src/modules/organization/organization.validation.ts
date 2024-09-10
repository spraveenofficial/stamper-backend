import Joi from 'joi';
import { NewCreateOrganization } from './organization.interfaces';

export const organizationRegisterBody: Record<keyof NewCreateOrganization, any> = {
  companyDomainName: Joi.string().required(),
  companyName: Joi.string().required(),
  companySize: Joi.string().required(),
  industryType: Joi.string().required(),
  companyRole: Joi.string().required(),
  needs: Joi.string().required(),
};
