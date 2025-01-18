import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { organizationService } from '.';
import { rolesEnum } from '../../config/roles';
import { employeeService } from '../employee';
import { IEmployeeDoc } from '../employee/employee.interfaces';
import { IOrganizationDoc, OrganizationRequestContext } from './organization.interfaces';

const organizationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Please authenticate' });
    }
    const { id, role } = req.user;
    let organization: IOrganizationDoc | IEmployeeDoc | null = null;

    if (role === rolesEnum.organization) {
      organization = await organizationService.getOrganizationByUserId(id);
    } else {
      organization = await employeeService.getEmployeeByUserId(id);
    }

    if (!organization) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
    }

    // Narrow down to check if it's IEmployeeDoc or IOrganizationDoc
    if ('officeId' in organization) {
      console.log("Employee's office ID:", organization.officeId); // Access fields specific to IEmployeeDoc
    } else {
      console.log('Organization-specific data:', organization.companyName); // Access fields specific to IOrganizationDoc
    }

    console.log('Console log organization middleware:', organization);
    req.organization = organization;
    return next();
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Forbidden' });
  }
};



const organizationMiddlewareV2 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Please authenticate' });
    }

    const { id, role } = req.user;
    let entity: IOrganizationDoc | IEmployeeDoc | null = null;

    // Fetch the appropriate entity based on role
    entity = role === rolesEnum.organization
      ? await organizationService.getOrganizationByUserId(id)
      : await employeeService.getEmployeeByUserId(id);

    if (!entity) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
    }

    // Create a unified context object that contains all necessary IDs
    const context: OrganizationRequestContext = {
      organizationId: 'organizationId' in entity ? entity.organizationId : entity.id,
      officeId: 'officeId' in entity ? entity.officeId : undefined,
      originalData: entity
    };

    // Attach the context to the request
    req.organizationContext = context;
    return next();
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Forbidden' });
  }
};


export { organizationMiddleware, organizationMiddlewareV2 };
