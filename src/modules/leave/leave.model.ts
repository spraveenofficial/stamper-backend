import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { ILeave, ILeaveDoc, ILeaveModel, LeaveStatus } from './leave.interfaces';

const leaveSchema = new mongoose.Schema<ILeaveDoc, ILeaveModel>(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveType: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

leaveSchema.plugin(toJSON);

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
