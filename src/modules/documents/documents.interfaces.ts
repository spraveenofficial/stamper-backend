import mongoose, { Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { rolesEnum } from '../../config/roles';

interface FileInDocument {
  name: string;
  url: string;
  size: string;
}

export interface IDocument {
  folderName: string;
  createdBy: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  description: string;
  access: rolesEnum[];
  documents: FileInDocument[];
}

export interface IDocumentDoc extends IDocument, Document {}

export interface IDocumentModel extends Model<IDocumentDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type NewDocumentType = Omit<IDocument, 'createdBy' | 'organizationId' | 'documents'>;