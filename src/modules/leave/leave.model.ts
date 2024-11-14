import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { ILeave, ILeaveDoc, ILeaveModel, LeaveStatus } from './leave.interfaces';
import { eventInterfaces, eventServices } from '../events';
// import moment from 'moment';

const leaveSchema = new mongoose.Schema<ILeaveDoc, ILeaveModel>(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'LeaveType',
    },
    total: {
      type: Number,
      required: true,
    },
    attachment: {
      type: String,
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: LeaveStatus,
      default: LeaveStatus.PENDING,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leaveSchema.plugin(toJSON);

leaveSchema.post('findOneAndUpdate', async function (doc: ILeaveDoc) {
  // Get the query conditions used in the `findOneAndUpdate` operation
  const queryConditions = this.getQuery();
  // Populate both `employeeId` and `leaveTypeId` based on these conditions
  const populatedData = await this.model.findOne(queryConditions).populate('leaveTypeId');

  console.log('Populated Data', populatedData);
  // Check if the leave was approved
  if (doc.status === LeaveStatus.APPROVED) {
    // Create event for leave
   const event =  await eventServices.createEvent(
      populatedData.employeeId,
      {
        title: `${populatedData?.leaveTypeId?.leaveType}`,
        description: `Leave for ${populatedData.total} days`,
        date: doc.startDate,
        startTime: "00:00",
        endTime: "23:59",
        note: doc.note,
        location: null,
        guests: [],
        link: null,
        timeZone: null,
      },
      eventInterfaces.EventType.ONLEAVE
    );
    console.log('Event', event);
  }
});

/**
 * Check if leave is already exist
 * @param {string} employeeId - The employee's id
 * @param {Date} startDate - The start date of the leave
 * @param {Date} endDate - The end date of the leave
 */
leaveSchema.static('isLeaveExist', async function (employeeId: string, startDate: Date, endDate: Date) {
  const leave = await this.findOne({ employeeId, startDate, endDate });
  return !!leave;
});

const Leave = mongoose.model<ILeave, ILeaveModel>('Leave', leaveSchema);

export default Leave;
