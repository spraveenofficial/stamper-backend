import mongoose, { Document, Model } from 'mongoose';
import { QueryResult } from '../paginate/paginate';

export interface IOfficeHRs {
  userId: mongoose.Types.ObjectId;
  addedBy: mongoose.Types.ObjectId;
  status: "active" | "inactive";
}

export interface IOffice {
  name: string;
  location: string;
  timezone: string;
  capacity: string;
  addedBy: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  isHeadQuarter: boolean;
  isOperational: boolean;
  contactNumber: string;
  contactEmail: string;
  companyOverview: string;
  hr: IOfficeHRs[];
}

export interface IOfficeDoc extends IOffice, Document { }

export interface IOfficeHrDoc extends IOfficeHRs, Document { }

export interface IOfficeHrModel extends Model<IOfficeHrDoc> { }

export interface IOfficeModel extends Model<IOfficeDoc> {
  isOfficeAddedByUser(officeId: mongoose.Types.ObjectId, name: string): Promise<boolean>;
  isHeadQuarterAdded(organizationId: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type NewAddOffice = Omit<IOffice, 'addedBy' | 'managerId' | 'isOperational' | 'organizationId' | 'officePolicies' | 'hr'>;

export type UpdateOffice = Omit<IOffice, 'addedBy' | 'managerId' | 'organizationId' | 'officePolicies' | 'isHeadQuarter' | "hr"> & {
  officeId: string;
};
