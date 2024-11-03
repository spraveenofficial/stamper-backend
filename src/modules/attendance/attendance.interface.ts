import mongoose from 'mongoose';

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
  clockinMode: string;
  clockoutMode: string;
  clockinImage: string;
  clockoutImage: string;
  clockinIpAddress: string;
  clockoutIpAddress: string;
  clockinDevice: string;
  clockoutDevice: string;
  clockinBrowser: string;
  clockoutBrowser: string;
  clockinOs: string;
  clockoutOs: string;
  isClockedin: boolean;
  isClockedout: boolean;
  isHavingLunch: boolean;
}

export interface IAttendanceDoc extends IAttendance, mongoose.Document {}

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
>;
