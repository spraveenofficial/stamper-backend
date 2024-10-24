import mongoose, { Document, Model } from 'mongoose';

export enum AttendanceClockinAndClockoutMode {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
}

export interface IAttendancePolicies {
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  policyName: string;
  policyDescription: string;
  clockInTime: string;
  clockOutTime: string;
  geofencing: boolean;
  geofencingRadius: number;
  clockInAndClockOutMode: AttendanceClockinAndClockoutMode[];
  qrEnabled: boolean;
  addedBy: mongoose.Types.ObjectId;
  location: {
    type: string;
    coordinates: number[];
  };
  locationText: string;
}

export interface IAttendancePoliciesDoc extends IAttendancePolicies, Document {}

export interface IAttendancePoliciesModel extends Model<IAttendancePoliciesDoc> {
  isPolicyExist(policyName: string, organizationId: mongoose.Types.ObjectId): Promise<boolean>;
}
