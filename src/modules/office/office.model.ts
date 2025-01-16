import mongoose, { Schema } from 'mongoose';
// import { userCapService } from '../common/userCap';
// CallbackError,
import { paginate } from '../paginate';
import { toJSON } from '../toJSON';
import { IOfficeDoc, IOfficeHrDoc, IOfficeHrModel, IOfficeModel } from './office.interfaces';

const officeHrSchema = new Schema<IOfficeHrDoc, IOfficeHrModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const officeSchema = new Schema<IOfficeDoc, IOfficeModel>(
  {
    name: {
      type: String,
      required: true,
    },
    timezone: {
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
      default: '1-10',
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
    hr: {
      type: [officeHrSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Add a pre-save hook that check if the office is already added by the user
officeSchema.static(
  'isOfficeAddedByUser',
  async function (organizationId: mongoose.Types.ObjectId, name: string): Promise<boolean> {
    const office = await this.findOne({ organizationId, name });
    return !!office;
  }
);

// Check if this organization has already a headquarter
officeSchema.static('isHeadQuarterAdded', async function (organizationId: mongoose.Types.ObjectId): Promise<boolean> {
  const office = await this.findOne({ organizationId, isHeadQuarter: true });
  return !!office;
});

officeSchema.plugin(toJSON);
officeSchema.plugin(paginate);

officeSchema.index({ organizationId: 1, name: 1 }, { unique: true });
officeSchema.index({ managerId: 1 });

// officeSchema.pre('save', async function (next) {
//   const office = this;
//   // check if the cap limit is reached
//   const isCapLimitReached = await userCapService.isCapLimitReached(office.organizationId, 'addOffice');
//   if (isCapLimitReached) {
//     next(new Error('Cap limit reached for adding office'));
//     return;
//   }
//   next();
// });

// Post hook function to update the caplimit of the organization
// officeSchema.post('save', async function (doc: IOfficeDoc, next) {
//   try {
//     await userCapService.updateCapLimitsByOrgIdAndKey(doc.organizationId, 'addOffice', 1);
//   } catch (error) {
//     next(error as CallbackError);
//     return;
//   }
//   next();
// });


export default mongoose.model<IOfficeDoc, IOfficeModel>('Office', officeSchema);
