import mongoose, { Schema } from 'mongoose';
import { IOfficeDoc, IOfficeModel } from './office.interfaces';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';

const officeModel = new Schema<IOfficeDoc, IOfficeModel>(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    capacity: {
      type: String,
      required: false,
      default: "1-10"
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isOperational: {
        type: Boolean,
        default: true,
    },
    isHeadQuarter: {
      type: Boolean,
      default: false,
    },
    contactNumber: {
      type: String,
      required: false,
      default: null,
    },
    contactEmail: {
      type: String,
      required: false,
      default: null,
    },
    companyOverview: {
      type: String,
      required: false,
    },
    officePolicies: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

officeModel.plugin(toJSON);
officeModel.plugin(paginate);

export default mongoose.model<IOfficeDoc, IOfficeModel>('Office', officeModel);
