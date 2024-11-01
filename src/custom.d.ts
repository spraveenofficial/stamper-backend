import { IEmployeeDoc } from './modules/employee/employee.interfaces';
import { IOrganizationDoc } from './modules/organization/organization.interfaces';
import { IUserDoc } from './modules/user/user.interfaces';

declare module 'express-serve-static-core' {
  export interface Request {
    user: IUserDoc;
    organization: IOrganizationDoc | IEmployeeDoc;
  }
}
