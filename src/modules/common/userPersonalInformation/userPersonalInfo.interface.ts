import mongoose, { Document, Model } from 'mongoose';
export enum GenderEnum {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum MaritalStatusEnum {
  SINGLE = 'Single',
  MARRIED = 'Married',
  DIVORCED = 'Divorced',
  WIDOWED = 'Widowed',
}

export interface IEmergencyContactDetails {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

export interface IBankAccountDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchName: string;
  ifscCode: string;
  isPrimary: boolean;
}

export interface IUserPersonalInfo {
  userId: mongoose.Types.ObjectId;
  userTimezone: string;
  gender: GenderEnum | null;
  maritalStatus: MaritalStatusEnum | null;
  personalEmail: string | null;
  dateOfBirth: Date | null;
  address: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  nationality: string;
  personalTaxId: string;
  emergencyContactDetails: IEmergencyContactDetails[];
  bankAccountDetails: IBankAccountDetails[];
}

export interface IUserPersonalInfoDoc extends IUserPersonalInfo, Document {}
export interface IUserPersonalInfoModel extends Model<IUserPersonalInfoDoc> {}

export interface IEmergencyContactDetailsDoc extends IEmergencyContactDetails, Document {}
export interface IEmergenyContactDetailsModel extends Model<IEmergencyContactDetailsDoc> {}

export interface IBankAccountDetailsDoc extends IBankAccountDetails, Document {}
export interface IBankAccountDetailsModel extends Model<IBankAccountDetailsDoc> {}

export type NewUserPersonalInfoPayload = Partial<IUserPersonalInfo>;