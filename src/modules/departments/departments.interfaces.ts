import mongoose, { Document, Model } from "mongoose";
import { QueryResult } from "../paginate/paginate";

export interface IDepartment {
  title: string;
  description: string;
  departmentHeadId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  isOperational: boolean;
}


export interface IDepartmentDoc extends IDepartment, Document {}

export interface IDepartmentModel extends Model<IDepartmentDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
  isDepartmentExists(officeId: mongoose.Types.ObjectId, title: string): Promise<boolean>;
}


export type NewDepartmentType = Omit<IDepartment, 'organizationId' | 'isOperational' | 'departmentHeadId'>;