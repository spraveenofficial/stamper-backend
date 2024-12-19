import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { IDepartmentDoc, IDepartmentModel } from './departments.interfaces';

const departmentSchema = new mongoose.Schema<IDepartmentDoc, IDepartmentModel>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    departmentHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
    },
    isOperational: {
      type: Boolean,
      default: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: true,
  }
);

// Static method to check if department exists
departmentSchema.static('isDepartmentExists', async function (officeId: mongoose.Types.ObjectId, title: string) {
  const department = await this.findOne({ officeId, title });
  return !!department;
});


departmentSchema.index({ officeId: 1, title: 1 }, { unique: true });

departmentSchema.plugin(toJSON);

const Department = mongoose.model<IDepartmentDoc, IDepartmentModel>('Department', departmentSchema);

export default Department;
