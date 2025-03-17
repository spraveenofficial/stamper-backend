import mongoose, { Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
// import { rolesEnum } from '../../config/roles';

interface FileInDocument {
  name: string;
  url: string;
  size: string;
}

export interface accessRoles{
  everyone: string;
  me: string;
  department: string;
  employee?: string[]
}

export interface EmployeesInterface {
  _id: mongoose.Types.ObjectId; 
  email: string;
}

export interface IDocument {
  _id?: mongoose.Types.ObjectId;
  folderName: string;
  createdBy: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  description: string;
  departmentId: mongoose.Types.ObjectId;
  access: accessRoles[];
  employees?: EmployeesInterface[];
  documents: FileInDocument[];
}

export interface IDocumentDoc extends IDocument, Document {}

export interface IDocumentModel extends Model<IDocumentDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
  isFolderAlreadyAdded(folderName: string, organizationId: mongoose.Types.ObjectId): Promise<boolean>;
}

export type NewDocumentType = Omit<IDocument, 'createdBy' | 'organizationId' | 'documents'>;
