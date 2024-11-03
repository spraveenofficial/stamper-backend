import mongoose from 'mongoose';
import { IAttendanceDoc, IAttendanceModel } from './attendance.interface';
import { toJSON } from '../toJSON';

const Schema = mongoose.Schema;

const attendanceSchema = new Schema<IAttendanceDoc, IAttendanceModel>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    officeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    clockinTime: {
      type: Date,
      required: true,
    },
    clockoutTime: {
      type: Date,
      required: false,
    },
    isGeoFencing: {
      type: Boolean,
      required: true,
    },
    clockinLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: function (this: IAttendanceDoc) {
          return this.isGeoFencing;
        },
      },
      locationText: {
        type: String,
        required: function (this: IAttendanceDoc) {
          return this.isGeoFencing;
        },
      },
    },
    clockoutLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: function (this: IAttendanceDoc) {
          return this.isGeoFencing;
        },
      },
      locationText: {
        type: String,
        required: function (this: IAttendanceDoc) {
          return this.isGeoFencing;
        },
      },
    },
    clockinMode: {
      type: String,
      required: true,
    },
    clockoutMode: {
      type: String,
      required: false,
    },
    clockinImage: {
      type: String,
      required: false,
    },
    clockoutImage: {
      type: String,
      required: false,
    },
    clockinIpAddress: {
      type: String,
      required: true,
    },
    clockoutIpAddress: {
      type: String,
      required: false,
    },
    clockinDevice: {
      type: String,
      required: true,
    },
    clockoutDevice: {
      type: String,
      required: false,
    },
    clockinBrowser: {
      type: String,
      required: true,
    },
    clockoutBrowser: {
      type: String,
      required: false,
    },
    clockinOs: {
      type: String,
      required: true,
    },
    clockoutOs: {
      type: String,
      required: false,
    },
    isClockedin: {
      type: Boolean,
      required: true,
    },
    isClockedout: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true }
);

attendanceSchema.statics['isAttendanceAlreadyMarkedToday'] = async function (
  employeeId: mongoose.Types.ObjectId,
  officeId: mongoose.Types.ObjectId
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employeeId,
    officeId,
    clockinTime: {
      $gte: today,
    },
  });

  return attendance ? true : false;
};

attendanceSchema.plugin(toJSON);

const Attendance = mongoose.model<IAttendanceDoc, IAttendanceModel>('Attendance', attendanceSchema);

export default Attendance;
