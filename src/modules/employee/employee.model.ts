import mongoose from 'mongoose';
import paginate from '../paginate/paginate';
import { toJSON } from '../toJSON';
import { employeeAccountStatus, employeeStatus, IEmployeeDoc, IEmployeeModel } from './employee.interfaces';

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
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ userId: 1 });
employeeSchema.index({ organizationId: 1 }, { unique: false });
employeeSchema.index({ userId: 1, organizationId: 1, officeId: 1 })

employeeSchema.index({ jobTitleId: 1, organizationId: 1, officeId: 1 }, { unique: false });
employeeSchema.plugin(toJSON);

employeeSchema.plugin(paginate);

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
