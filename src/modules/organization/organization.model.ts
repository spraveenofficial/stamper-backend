import mongoose from 'mongoose';
import { industryType, IOrganization, IOrganizationModel } from './organization.interfaces';
import { toJSON } from '../toJSON/index';
import validator from 'validator';

export const organizationSchema = new mongoose.Schema<IOrganization, IOrganizationModel>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyDomainName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 3,
      validate(value: string) {
        if (!validator.isAlphanumeric(value)) {
          throw new Error('Company domain name must contain only alphanumeric characters');
        }
      },
    },
    companySize: {
      type: String,
      required: true,
      trim: true,
    },
    industryType: {
      type: String,
      required: true,
      trim: true,
      enum: industryType,
    },
    companyRole: {
      type: String,
      required: true,
      trim: true,
    },
    needs: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.plugin(toJSON);

organizationSchema.static(
  'isOrganizationDomainNameTaken',
  async function (companyDomainName: string, excludeOrganizationId?: string) {
    const organization = await this.findOne({ companyDomainName, _id: { $ne: excludeOrganizationId } });
    return !!organization;
  }
);

const Organization = mongoose.model<IOrganization, IOrganizationModel>('Organization', organizationSchema);

export default Organization;
