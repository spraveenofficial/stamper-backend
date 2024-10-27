import mongoose from 'mongoose';
import { IAttendanceOfficeConfig, IAttendanceOfficeConfigDoc } from './attendanceOfficeConfig.interface';
import { toJSON } from '@/modules/toJSON';

const { Schema } = mongoose;

const attendanceOfficeConfigSchema = new Schema<IAttendanceOfficeConfigDoc, IAttendanceOfficeConfig>(
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
    officeLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
      required: function (this: IAttendanceOfficeConfigDoc) {
        return this.geofencing;
      },
    },
    geofencing: {
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
    officeBreakDuration: {
      type: Number,
      required: true,
    },
    officeBreakDurationUnit: {
      type: String,
      required: true,
    },
    officeWorkingDays: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceOfficeConfigSchema.index({ officeLocation: '2dsphere' });

attendanceOfficeConfigSchema.plugin(toJSON);

export const AttendanceOfficeConfig = mongoose.model<IAttendanceOfficeConfigDoc>(
  'AttendanceOfficeConfig',
  attendanceOfficeConfigSchema
);
