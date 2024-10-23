import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { organizationService } from '.';
import { employeeService } from '../employee';
import { rolesEnum } from '../../config/roles';
import { IOrganizationDoc } from './organization.interfaces';

const organizationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Please authenticate' });
    }

    const { id, role } = req.user;

    let organization;
    if (role === rolesEnum.organization) {
      const org = await organizationService.getOrganizationByUserId(id);
      organization = org;
    } else {
      const org = await employeeService.getEmployeeByUserId(id);
      organization = org;
    }

    if (!organization) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
    }

    req.organization = organization as IOrganizationDoc;
    return next();
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Forbidden' });
  }
};

export { organizationMiddleware };
