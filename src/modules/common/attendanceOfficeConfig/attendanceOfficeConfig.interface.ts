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
  isActive: boolean;
  schedule: {
    startTime?: string; // Only for clock-based schedules
    endTime?: string;   // Only for clock-based schedules
    hours?: number;     // Only for duration-based schedules
  };
}


export interface IAttendanceOfficeConfig {
  policyTitle: string;
  organizationId: mongoose.Types.ObjectId;
  scheduleType: OfficeScheduleTypeEnum;
  officeId: mongoose.Types.ObjectId;
  clockinMode: AttendanceClockinAndClockoutMode[] | null;
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
}

export interface IAttendanceOfficeConfigDoc extends IAttendanceOfficeConfig, Document { }

export interface IAttendanceOfficeConfigModel extends Model<IAttendanceOfficeConfigDoc> {
  isAlreadyExist(officeId: mongoose.Types.ObjectId): Promise<boolean>;
}


export interface IIAttendanceWorkingDaysConfigDoc extends IAttendanceWorkingDaysConfig, Document { }
export interface IIAttendanceWorkingDaysConfigModel extends Model<IIAttendanceWorkingDaysConfigDoc> { }

export type NewAttendanceConfigPayload = Omit<IAttendanceOfficeConfig, 'organizationId' | 'addedBy' | 'isActive' | 'selfieRequired' | 'effectiveFrom'>;

export type UpdateAttendanceConfigPayload = Partial<NewAttendanceConfigPayload> & { id: mongoose.Types.ObjectId };
