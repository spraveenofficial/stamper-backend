import mongoose, { Model, Document } from 'mongoose';

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ILeave {
  employeeId: mongoose.Schema.Types.ObjectId;
  leaveTypeId: mongoose.Schema.Types.ObjectId;
  total: number;
  attachment: string;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  note: string;
  cancellationReason: string;
}

export interface ILeaveModel extends Model<ILeave> {
  isLeaveExist(employeeId: mongoose.Types.ObjectId, startDate: Date, endDate: Date): Promise<boolean>;
}

export interface ILeaveDoc extends ILeave, Document {
  // [x: string]: FilterQuery<any> | undefined;
}

export type NewLeave = Omit<ILeave, 'employeeId' | 'status' | 'cancellationReason'>;
export type UpdateLeave = Omit<ILeave, 'employeeId' | 'status' | 'cancellationReason'>;
