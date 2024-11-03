import mongoose from 'mongoose';
import {
  AttendanceClockinAndClockoutMode,
  IAttendanceOfficeConfigDoc,
  IAttendanceOfficeConfigModel,
  OfficeWorkingDaysEnum,
} from './attendanceOfficeConfig.interface';
import { toJSON } from '../../../modules/toJSON';

const { Schema } = mongoose;

const attendanceOfficeConfigSchema = new Schema<IAttendanceOfficeConfigDoc, IAttendanceOfficeConfigModel>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Organization',
    },
    officeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Office',
    },
    policyDescription: {
      type: String,
      required: true,
    },
    officeLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
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
      required: true,
      enum: Object.values(AttendanceClockinAndClockoutMode),
    },
    geofencing: {
      type: Boolean,
      required: true,
    },
    qrEnabled: {
      type: Boolean,
      required: true,
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
    officeStartTime: {
      type: String,
      required: true,
    },
    officeEndTime: {
      type: String,
      required: true,
    },
    officeBreakStartTime: {
      type: String,
      required: true,
    },
    officeBreakEndTime: {
      type: String,
      required: true,
    },
    officeBreakDurationInMinutes: {
      type: Number,
      required: true,
    },
    officeWorkingDays: {
      type: [String],
      required: true,
      enum: Object.values(OfficeWorkingDaysEnum),
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
