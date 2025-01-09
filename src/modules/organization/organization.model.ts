import mongoose, { CallbackError } from 'mongoose';
import validator from 'validator';
import { rolesEnum } from '../../config/roles';
import { plansInterfaces } from '../common/plans';
import { userCapService } from '../common/userCap';
import { paginate } from '../paginate';
import { subscriptionServices } from '../subscriptions';
import { toJSON } from '../toJSON/index';
import { industryType, IOrganizationDoc, IOrganizationModel } from './organization.interfaces';

export const organizationSchema = new mongoose.Schema<IOrganizationDoc, IOrganizationModel>(
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
organizationSchema.plugin(paginate);

// check if user have already added an organization
organizationSchema.static('isOrganizationExist', async function (userId: mongoose.Types.ObjectId) {
  const organization = await this.findOne({ userId });
  return !!organization;
});

organizationSchema.static(
  'isOrganizationDomainNameTaken',
  async function (companyDomainName: string, excludeOrganizationId?: string) {
    const organization = await this.findOne({ companyDomainName, _id: { $ne: excludeOrganizationId } });
    return !!organization;
  }
);

// Indexes
organizationSchema.index({ userId: 1 });

organizationSchema.post('save', async function (doc: IOrganizationDoc, next) {
  try {
    const role = rolesEnum.organization;
    const plan = plansInterfaces.SubscriptionPlanEnum.FREE;
    await userCapService.addUserCapBasedOnRoleAndPlan(doc._id, role, plan);
    await subscriptionServices.createTrailSubscriptionForOrganization(doc._id, doc.userId.text.toString());
  } catch (error) {
    next(error as CallbackError);
    return;
  }
  next();
});

const Organization = mongoose.model<IOrganizationDoc, IOrganizationModel>('Organization', organizationSchema);

export default Organization;
