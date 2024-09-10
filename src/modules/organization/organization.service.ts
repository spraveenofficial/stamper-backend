import httpStatus from 'http-status';
import { ApiError } from '../errors';
import Organization  from './organization.model';

export const createOrganization = async (organizationBody: any, userId: string): Promise<any> => {
  if (await Organization.isOrganizationDomainNameTaken(organizationBody.companyDomainName)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Company domain name already taken');
  }

  return Organization.create({ ...organizationBody, userId: userId });
};
