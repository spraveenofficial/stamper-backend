import mongoose, { Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IEmployee {
  userId: mongoose.Types.ObjectId;
  jobTitle: string;
  managerId: mongoose.Types.ObjectId;
  department: string;
  office: string;
  employeeStatus: string;
  accountStatus: string;
}

export interface IEmployeeDoc extends IEmployee, Document {}

export interface IEmployeeModel extends Model<IEmployeeDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}
