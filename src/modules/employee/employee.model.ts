import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { employeeAccountStatus, employeeStatus, IEmployeeDoc, IEmployeeModel } from './employee.interfaces';
import paginate from '../paginate/paginate';

const employeeSchema = new mongoose.Schema<IEmployeeDoc, IEmployeeModel>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobTitleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobTitle',
      required: true,
    },
    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
      required: true,
    },
    employeeStatus: {
      type: String,
      enum: employeeStatus,
      default: employeeStatus.Inactive,
    },
    accountStatus: {
      type: String,
      enum: employeeAccountStatus,
      default: employeeAccountStatus.Invited,
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

employeeSchema.plugin(toJSON);

employeeSchema.plugin(paginate);

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
