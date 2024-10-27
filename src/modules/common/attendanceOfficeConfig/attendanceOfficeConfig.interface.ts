import mongoose, { Document, Model } from 'mongoose';

export enum AttendanceClockinAndClockoutMode {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
}

export interface IAttendanceOfficeConfig {
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  policyName: string;
  policyDescription: string;
  officeLocation: {
    type: string;
    coordinates: number[];
  };
  qrEnabled: boolean;
  clockinMode: AttendanceClockinAndClockoutMode[];
  geofencing: boolean;
  radius: number | null;
  officeLocationText: string;
  officeStartTime: string;
  officeEndTime: string;
  officeBreakStartTime: string;
  officeBreakEndTime: string;
  officeBreakDuration: number;
  officeBreakDurationUnit: string;
  officeWorkingDays: string[];
}

export interface IAttendanceOfficeConfigDoc extends IAttendanceOfficeConfig, Document {}

export interface IAttendanceOfficeConfigModel extends Model<IAttendanceOfficeConfigDoc> {}
