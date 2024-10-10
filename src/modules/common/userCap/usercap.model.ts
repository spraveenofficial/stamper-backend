import mongoose from 'mongoose';
import { ICapLimitsDoc, ICapLimitsModel } from './usercap.interfaces';

const Schema = mongoose.Schema;

const UserCapSchema = new Schema<ICapLimitsDoc, ICapLimitsModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentLimitId: {
    type: Schema.Types.ObjectId,
    ref: 'UserCap',
    required: false,
    default: null,
  },
  addOffice: {
    type: Number,
    default: 0,
  },
  addDepartment: {
    type: Number,
    default: 0,
  },
  addJobTitle: {
    type: Number,
    default: 0,
  },
  addEmployee: {
    type: Number,
    default: 0,
  },
  addManager: {
    type: Number,
    default: 0,
  },
  addFolder: {
    type: Number,
    default: 0,
  },
  addDocument: {
    type: Number,
    default: 0,
  },
  canSubscribeToPlan: {
    type: Boolean,
    default: false,
  },
});

UserCapSchema.statics['isCapLimitExist'] = async function (userId: mongoose.Types.ObjectId) {
  const userCap = await this.findOne({ userId });
  return !!userCap;
};

// Method to create or update a UserCap for an organization
UserCapSchema.statics['createOrUpdateOrgCap'] = async function (
  userId: mongoose.Types.ObjectId,
  limits: Partial<ICapLimitsDoc>
) {
  let userCap = await this.findOne({ userId });

  if (!userCap) {
    userCap = new this({ userId, ...limits });
  } else {
    Object.assign(userCap, limits);
  }

  await userCap.save();
  return userCap;
};

UserCapSchema.statics['createOrUpdateModeratorCap'] = async function (
  moderatorId: mongoose.Types.ObjectId,
  orgCapId: mongoose.Types.ObjectId
) {
  const orgCap = await this.findById(orgCapId);
  if (!orgCap) {
    throw new Error("Organization cap does not exist");
  }

  // Check if the moderator cap already exists
  let moderatorCap = await this.findOne({ userId: moderatorId });

  if (!moderatorCap) {
    // If the moderator cap doesn't exist, create a new one
    moderatorCap = new this({
      userId: moderatorId,
      parentLimitId: orgCapId,
      addOffice: 0, // Remain zero
      addDepartment: 0, // Remain zero
      addJobTitle: 0, // Remain zero
      addEmployee: 0, // Remain zero
      addManager: 0, // Remain zero
      addFolder: 0, // Remain zero
      addDocument: 0, // Remain zero
      canSubscribeToPlan: false, // Default to false
    });
  } else {
    // If the moderator cap exists, just update the parentLimitId
    moderatorCap.parentLimitId = orgCapId;
  }

  await moderatorCap.save();
  return moderatorCap;
};


const UserCap = mongoose.model<ICapLimitsDoc, ICapLimitsModel>('UserCap', UserCapSchema);

export default UserCap;
