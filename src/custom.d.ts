import { IEmployeeDoc } from './modules/employee/employee.interfaces';
import { IOrganizationDoc, OrganizationRequestContext } from './modules/organization/organization.interfaces';
import 'mongoose';
import 'mongoose';
import { IUserDoc } from './modules/user/user.interfaces';



declare module 'express-serve-static-core' {
  export interface Request {
    user: IUserDoc;
    organization: IOrganizationDoc | IEmployeeDoc;
    organizationContext: OrganizationRequestContext;
  }
}



declare module 'mongoose' {
  interface Query<ResultType, DocType, THelpers = {}, RawDocType = ResultType> {
    _cachedResult?: ResultType; // Add custom property
  }
}

