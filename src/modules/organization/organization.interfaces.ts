import mongoose, { Document, Model } from 'mongoose';
import { IEmployeeDoc } from '../employee/employee.interfaces';
import { QueryResult } from '../paginate/paginate';

export enum industryType {
  Agriculture = 'Agriculture',
  Apparel = 'Apparel',
  Banking = 'Banking',
  Biotechnology = 'Biotechnology',
  Chemicals = 'Chemicals',
  Communications = 'Communications',
  Construction = 'Construction',
  Consulting = 'Consulting',
  Education = 'Education',
  Electronics = 'Electronics',
  Energy = 'Energy',
  Engineering = 'Engineering',
  Entertainment = 'Entertainment',
  Environmental = 'Environmental',
  Finance = 'Finance',
  FoodBeverage = 'Food & Beverage',
  Government = 'Government',
  Healthcare = 'Healthcare',
  Hospitality = 'Hospitality',
  Insurance = 'Insurance',
  Machinery = 'Machinery',
  Manufacturing = 'Manufacturing',
  Media = 'Media',
  NotForProfit = 'Not For Profit',
  Recreation = 'Recreation',
  Retail = 'Retail',
  Shipping = 'Shipping',
  Technology = 'Technology',
  Telecommunications = 'Telecommunications',
  Transportation = 'Transportation',
  Utilities = 'Utilities',
  Other = 'Other',
}

export interface IOrganization {
  userId: mongoose.Schema.Types.ObjectId;
  companyName: string;
  companyDomainName: string;
  companySize: string;
  industryType: industryType;
  companyRole: string;
  needs: string;
}

export interface IOrganizationDoc extends IOrganization, Document {
}
export interface IOrganizationModel extends Model<IOrganizationDoc> {
  isOrganizationExist(userId: mongoose.Types.ObjectId): Promise<boolean>;
  isOrganizationDomainNameTaken(companyDomainName: string, excludeOrganizationId?: string): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type NewCreateOrganization = Omit<IOrganization, 'userId'>;



export interface OrganizationRequestContext {
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId | undefined | null;
  originalData: IOrganizationDoc | IEmployeeDoc;
}