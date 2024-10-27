import mongoose, { Document, Model } from 'mongoose';

export interface IAttendanceOfficeConfig {
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  officeLocation: {
    type: string;
    coordinates: number[];
  };
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
  officeTimezone: string;
}

export interface IAttendanceOfficeConfigDoc extends IAttendanceOfficeConfig, Document {}

export interface IAttendanceOfficeConfigModel extends Model<IAttendanceOfficeConfigDoc> {}
