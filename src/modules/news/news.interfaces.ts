import mongoose, { Document, Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { rolesEnum } from '../../config/roles';

export enum NewsStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled',
}

export interface INews {
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  status: NewsStatus;
  access: rolesEnum[];
  scheduledAt?: Date;
}

export interface INewsDoc extends INews, Document {}

export interface INewsModel extends Model<INewsDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}


export type NewNewsType = Omit<INews, 'createdBy'>;