import mongoose, { Schema } from 'mongoose';
import { IOfficeDoc, IOfficeModel } from './office.interfaces';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';

const officeSchema = new Schema<IOfficeDoc, IOfficeModel>(
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
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
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

// Add a pre-save hook that check if the office is already added by the user
officeSchema.static('isOfficeAddedByUser', async function (organizationId: mongoose.Types.ObjectId, name: string): Promise<boolean> {
  const office = await this.findOne({ organizationId, name });
  return !!office;
});

// Check if this organization has already a headquarter
officeSchema.static('isHeadQuarterAdded', async function (organizationId: mongoose.Types.ObjectId): Promise<boolean> {
  const office = await this.findOne({ organizationId, isHeadQuarter: true });
  return !!office;
});

officeSchema.plugin(toJSON);
officeSchema.plugin(paginate);

export default mongoose.model<IOfficeDoc, IOfficeModel>('Office', officeSchema);
