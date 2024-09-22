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
    jobTitle: {
      type: String,
      required: true,
    },
    joiningDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    office: {
      type: String,
      required: true,
    },
    employeeStatus: {
      type: String,
      enum: employeeStatus,
      default: employeeStatus.Active,
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

employeeSchema.plugin(toJSON);
employeeSchema.plugin(paginate);

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
