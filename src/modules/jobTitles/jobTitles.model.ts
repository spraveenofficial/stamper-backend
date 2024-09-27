import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { IJobTitleDoc, IJobTitleModel } from './jobTitles.interfaces';

const jobTitleSchema = new mongoose.Schema<IJobTitleDoc, IJobTitleModel>(
  {
    jobTitle: {
      type: String,
      required: true,
    },
    jobTitleDescription: {
      type: String,
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    isOperational: {
      type: Boolean,
      default: true,
    },
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office',
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

jobTitleSchema.static('isJobTitleExists', async function (officeId: mongoose.Types.ObjectId, title: string) {
  const jobTitle = await this.findOne({ officeId, title });
  return !!jobTitle;
});

jobTitleSchema.plugin(toJSON);


const JobTitle = mongoose.model<IJobTitleDoc, IJobTitleModel>('JobTitle', jobTitleSchema);

export default JobTitle;