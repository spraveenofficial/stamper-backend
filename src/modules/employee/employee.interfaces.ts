import mongoose, { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IEmployee {
  userId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  employeeStatus: employeeStatus;
  accountStatus: employeeAccountStatus;
  joiningDate: Date;
  jobTitle: string;
  department: string;
  office: string;
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

export enum employeeAccountStatus {
  Active = 'Active',
  Invited = 'Invited',
}


export type NewEmployee = Omit<IEmployee, 'userId' | 'accountStatus' | 'managerId' | 'organizationId' | 'role'>;