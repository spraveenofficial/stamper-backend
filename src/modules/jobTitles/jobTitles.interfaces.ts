import mongoose, { Document, Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IJobTitle {
  jobTitle: string;
  jobTitleDescription: string;
  departmentId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  isOperational: boolean;
  officeId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
}

export interface IJobTitleDoc extends IJobTitle, Document {}

export interface IJobTitleModel extends Model<IJobTitleDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
  isJobTitleExists(officeId: mongoose.Types.ObjectId, title: string, organizationId: mongoose.Types.ObjectId): Promise<boolean>;
}

export type NewJobTitleType = Omit<IJobTitle, 'isOperational' | 'managerId' | 'organizationId'>

export type UpdateJobTitleType = Partial<IJobTitle> & { jobTitleId: mongoose.Types.ObjectId };