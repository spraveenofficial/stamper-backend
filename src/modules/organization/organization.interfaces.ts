import mongoose, { Model, Document } from 'mongoose';

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

export interface IOrganizationModel extends Model<IOrganization> {
  isOrganizationDomainNameTaken(companyDomainName: string, excludeOrganizationId?: string): Promise<boolean>;
  isOrganizationExist(userId: mongoose.Types.ObjectId): Promise<boolean>;
}

export type NewCreateOrganization = Omit<IOrganization, 'userId'>;

export interface IOrganizationDoc extends IOrganization, Document {}
