import mongoose, { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IEmployee {
  userId: mongoose.Types.ObjectId;
  employeeStatus: employeeStatus;
  accountStatus: employeeAccountStatus;
  joiningDate: Date;
  jobTitleId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
}

export interface IEmployeeDoc extends IEmployee, Document {}

export interface IEmployeeModel extends Model<IEmployeeDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export enum employeeStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  OnLeave = 'OnLeave',
  Resigned = 'Resigned',
}
export type EmployeeStatus = 'Active' | 'Inactive' | 'OnLeave' | 'Resigned';

export enum employeeAccountStatus {
  Active = 'Active',
  Invited = 'Invited',
}

export type NewEmployee = Omit<
  IEmployee,
  'userId' | 'accountStatus' | 'employeeStatus' | 'organizationId'
>;
