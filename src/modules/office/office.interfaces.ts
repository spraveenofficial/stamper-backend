import mongoose, { Document, Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IOffice {
    name: string;
    location: string;
    capacity: string;
    addedBy: mongoose.Types.ObjectId;
    managerId: mongoose.Types.ObjectId;
    isHeadQuarter: boolean;
    isOperational: boolean;
    contactNumber: string;
    contactEmail: string;
    companyOverview: string;
    officePolicies: string[];
}

export interface IOfficeDoc extends IOffice, Document {}

export interface IOfficeModel extends Model<IOfficeDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}


export type NewAddOffice = Omit<IOffice, 'addedBy' | 'managerId' | 'isOperational'>;