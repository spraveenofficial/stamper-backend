import mongoose from 'mongoose';
import { AttendanceClockinAndClockoutMode } from '../common/attendanceOfficeConfig/attendanceOfficeConfig.interface';


export enum IAttendanceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}


export interface IAttendance {
  employeeId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  clockinTime: Date;
  clockoutTime: Date;
  isGeoFencing: boolean;
  clockinLocation: {
    type: string;
    coordinates: number[];
    locationText: string;
  };
  clockoutLocation: {
    type: string;
    coordinates: number[];
    locationText: string;
  };
  clockinMode: AttendanceClockinAndClockoutMode;
  clockoutMode: AttendanceClockinAndClockoutMode;
  clockinImage: string;
  clockoutImage: string;
  clockinIpAddress: string;
  clockoutIpAddress: string;
  clockoutDevice: string;
  clockinBrowser: string;
  clockoutBrowser: string;
  clockinOs: string;
  clockoutOs: string;
  isClockedin: boolean;
  isClockedout: boolean;
  isHavingLunch: boolean;
  totalLoggedHours: number;
  remark: string;
  status: IAttendanceStatus;
}

export interface IAttendanceDoc extends IAttendance, mongoose.Document { }

export interface IAttendanceModel extends mongoose.Model<IAttendanceDoc> {
  isAttendanceAlreadyMarkedToday(employeeId: mongoose.Types.ObjectId, officeId: mongoose.Types.ObjectId): Promise<boolean>;
}

export type CreateClockinPayload = Omit<
  IAttendance,
  | 'clockoutTime'
  | 'employeeId'
  | 'organizationId'
  | 'isClockedin'
  | 'isClockedout'
  | 'isHavingLunch'
  | 'clockoutLocation'
  | 'clockoutMode'
  | 'clockoutImage'
  | 'clockoutIpAddress'
  | 'clockoutDevice'
  | 'clockoutBrowser'
  | 'clockoutOs'
  | 'totalLoggedHours'
  | 'status'
  | 'remark'
>;

export type CreateClockinPayloadForOrganizationUser = Omit<CreateClockinPayload, 'officeId'>;

export type CreateClockoutPayload = Omit<
  IAttendance,
  | 'clockinTime'
  | 'employeeId'
  | 'organizationId'
  | 'isClockedin'
  | 'isClockedout'
  | 'isHavingLunch'
  | 'clockinLocation'
  | 'clockinMode'
  | 'clockinImage'
  | 'clockinIpAddress'
  | 'clockinBrowser'
  | 'clockinOs'
  | 'totalLoggedHours'
  | 'status'
  | 'remark'
>;
