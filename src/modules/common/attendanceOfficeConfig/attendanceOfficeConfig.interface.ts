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

export enum OfficeScheduleTypeEnum {
  DURATION = 'duration',
  CLOCK = 'clock',
}

export interface IAttendanceWorkingDaysConfig {
  day: OfficeWorkingDaysEnum;
  schedule: {
    isActive: boolean;
    startTime?: string; // Only for clock-based schedules
    endTime?: string; // Only for clock-based schedules
    hours?: number; // Only for duration-based schedules
  };
}

export interface IAttendanceOfficeConfig {
  policyTitle: string;
  organizationId: mongoose.Types.ObjectId;
  scheduleType: OfficeScheduleTypeEnum;
  officeId: mongoose.Types.ObjectId;
  clockinMode: AttendanceClockinAndClockoutMode[];
  effectiveFrom: Date;
  geofencing: boolean;
  selfieRequired: boolean;
  officeLocation: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  qrEnabled: boolean;
  radius: number | null;
  officeLocationText: string;
  workingDays: IAttendanceWorkingDaysConfig[];
  addedBy: mongoose.Types.ObjectId;
  isActive: boolean;
  standardHoursInADay: number;
}

export interface IAttendanceOfficeConfigDoc extends IAttendanceOfficeConfig, Document { }

export interface IAttendanceOfficeConfigModel extends Model<IAttendanceOfficeConfigDoc> {
  isAlreadyExist(officeId: mongoose.Types.ObjectId): Promise<boolean>;
}

export type NewWorkSchedulePayload = Omit<
  IAttendanceOfficeConfig,
  | 'organizationId'
  | 'addedBy'
  | 'isActive'
  | 'selfieRequired'
  | 'clockinMode'
  | 'geofencing'
  | 'qrEnabled'
  | 'radius'
  | 'officeLocation'
  | 'officeLocationText'
>;

export interface IAttendanceWorkingDaysConfigDoc extends IAttendanceWorkingDaysConfig, Document { }
export interface IAttendanceWorkingDaysConfigModel extends Model<IAttendanceWorkingDaysConfigDoc> { }

export type AttendanceConfigPayload = Omit<
  IAttendanceOfficeConfig,
  'organizationId' | 'addedBy' | 'isActive' | 'effectiveFrom' | 'scheduleType' | 'workingDays' | 'standardHoursInADay'
>;

export type UpdateAttendanceConfigPayload = Partial<IAttendanceOfficeConfig> & { id: mongoose.Types.ObjectId };
