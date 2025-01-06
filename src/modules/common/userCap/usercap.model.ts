import mongoose from 'mongoose';
import { ICapLimitsDoc, ICapLimitsModel } from './usercap.interfaces';

const Schema = mongoose.Schema;

const UserCapSchema = new Schema<ICapLimitsDoc, ICapLimitsModel>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
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

const UserCap = mongoose.model<ICapLimitsDoc, ICapLimitsModel>('UserCap', UserCapSchema);

export default UserCap;
