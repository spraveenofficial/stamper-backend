import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { organizationService } from '.';
import { employeeService } from '../employee';
import { rolesEnum } from '../../config/roles';
import { IOrganizationDoc } from './organization.interfaces';
import { IEmployeeDoc } from '../employee/employee.interfaces';

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

export { organizationMiddleware };
