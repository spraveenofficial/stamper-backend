import mongoose from 'mongoose';
import { toJSON } from '../../../modules/toJSON';
import {
  AttendanceClockinAndClockoutMode,
  IAttendanceOfficeConfigDoc,
  IAttendanceOfficeConfigModel,
  IAttendanceWorkingDaysConfig,
  IIAttendanceWorkingDaysConfigModel,
  OfficeScheduleTypeEnum,
  OfficeWorkingDaysEnum,
} from './attendanceOfficeConfig.interface';

const { Schema } = mongoose;

const attendanceOfficeWorkingDaysConfigSchema = new Schema<IAttendanceWorkingDaysConfig, IIAttendanceWorkingDaysConfigModel>(
  {
    day: {
      type: String,
      required: true,
      enum: Object.values(OfficeWorkingDaysEnum),
    },
    schedule: {
      startTime: {
        type: String,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      endTime: {
        type: String,
      },
      hours: {
        type: Number,
      },
    },
  },
  {
    _id: false,
  }
);


const attendanceOfficeConfigSchema = new Schema<IAttendanceOfficeConfigDoc, IAttendanceOfficeConfigModel>(
  {
    policyTitle: {
      type: String,
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Organization',
    },
    scheduleType: {
      type: String,
      required: true,
      enum: Object.values(OfficeScheduleTypeEnum),
    },
    officeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Office',
    },
    officeLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: function (this: IAttendanceOfficeConfigDoc) {
          return this.geofencing;
        },
      },
      coordinates: {
        type: [Number],
        required: function (this: IAttendanceOfficeConfigDoc) {
          return this.geofencing;
        },
      },
    },
    clockinMode: {
      type: [String],
      required: false,
      default: [AttendanceClockinAndClockoutMode.DESKTOP],
      enum: Object.values(AttendanceClockinAndClockoutMode),
    },
    selfieRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    geofencing: {
      type: Boolean,
      required: true,
      default: false,
    },
    qrEnabled: {
      type: Boolean,
      required: true,
      default: false
    },
    radius: {
      type: Number,
      required: function (this: IAttendanceOfficeConfigDoc) {
        return this.geofencing;
      },
    },
    officeLocationText: {
      type: String,
      required: function (this: IAttendanceOfficeConfigDoc) {
        return this.geofencing;
      },
    },
    workingDays: {
      type: [attendanceOfficeWorkingDaysConfigSchema],
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    standardHoursInADay: {
      type: Number,
      required: true,
      default: 8,
    }
  },
  {
    timestamps: true,
  }
);

attendanceOfficeConfigSchema.index({ officeLocation: '2dsphere' });

attendanceOfficeConfigSchema.plugin(toJSON);

attendanceOfficeConfigSchema.statics['isAlreadyExist'] = async function (officeId: string) {
  const officeConfig = await this.findOne({ officeId, isActive: true });
  return officeConfig;
};

export const AttendanceOfficeConfig = mongoose.model<IAttendanceOfficeConfigDoc, IAttendanceOfficeConfigModel>(
  'AttendanceOfficeConfig',
  attendanceOfficeConfigSchema
);
