import mongoose from 'mongoose';

export interface IAttendance {
  employeeId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  clockinTime: Date;
  clockoutTime: Date;
  clockinLocation: {
    type: string;
    coordinates: number[];
  };
  clockoutLocation: {
    type: string;
    coordinates: number[];
  };
  clockinMode: string;
  clockoutMode: string;
  clockinVia: string;
  clockoutVia: string;
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
}


export interface IAttendanceDoc extends IAttendance, mongoose.Document {}

export interface IAttendanceModel extends mongoose.Model<IAttendanceDoc> {
    isAttendanceAlreadyMarkedToday(employeeId: mongoose.Types.ObjectId, officeId: mongoose.Types.ObjectId): Promise<boolean>;
}