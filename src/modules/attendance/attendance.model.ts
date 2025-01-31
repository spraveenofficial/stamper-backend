import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { IAttendanceDoc, IAttendanceModel } from './attendance.interface';

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
        required: false,
      },
      locationText: {
        type: String,
        required: false,
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
    isHavingLunch: {
      type: Boolean,
      required: false,
    },
    totalLoggedHours: {
      type: Number,
      required: false,
      default: null
    },
  },
  { timestamps: true }
);

attendanceSchema.post('findOneAndUpdate', async function (doc: IAttendanceDoc) {
  if (doc.isClockedout && doc.clockoutTime && doc.clockinTime) {
    const clockinTime = new Date(doc.clockinTime);
    const clockoutTime = new Date(doc.clockoutTime);

    // Validate that clockoutTime is later than clockinTime
    if (clockoutTime > clockinTime) {
      // Calculate the total logged hours
      const diff = clockoutTime.getTime() - clockinTime.getTime();
      const hours = diff / (1000 * 60 * 60);
      doc.totalLoggedHours = parseFloat(hours.toFixed(2)); // Set totalLoggedHours to 2 decimal places

      // Save the updated document with total logged hours
      await doc.save();
    } else {
      console.error('Invalid times: clockoutTime must be later than clockinTime');
    }
  }
});

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
