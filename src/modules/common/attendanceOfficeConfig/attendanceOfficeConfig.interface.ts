import mongoose, { Document, Model } from 'mongoose';

export enum AttendanceClockinAndClockoutMode {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
}

export enum OfficeWorkingDaysEnum {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
}

export interface IAttendanceOfficeConfig {
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  policyDescription: string;
  officeLocation: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
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
  officeBreakDurationInMinutes: number;
  officeWorkingDays: OfficeWorkingDaysEnum[];
  addedBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

export interface IAttendanceOfficeConfigDoc extends IAttendanceOfficeConfig, Document {}

export interface IAttendanceOfficeConfigModel extends Model<IAttendanceOfficeConfigDoc> {
  isAlreadyExist(officeId: mongoose.Types.ObjectId): Promise<boolean>;
}

export type NewAttendanceConfigPayload = Omit<IAttendanceOfficeConfig, 'organizationId' | 'addedBy' | 'isActive'>;
