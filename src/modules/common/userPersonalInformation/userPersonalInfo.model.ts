import mongoose from 'mongoose';
import { GenderEnum, IUserPersonalInfoDoc, IUserPersonalInfoModel, MaritalStatusEnum } from './userPersonalInfo.interface';
import { toJSON } from '@/modules/toJSON';

const Schema = mongoose.Schema;

const userPersonalInfoSchema = new Schema<IUserPersonalInfoDoc, IUserPersonalInfoModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    userTimezone: {
      type: String,
      required: false,
      default: 'UTC',
    },
    gender: {
      type: String,
      enum: GenderEnum,
      required: false,
      default: null,
    },
    maritalStatus: {
      type: String,
      enum: MaritalStatusEnum,
      required: false,
      default: null,
    },
    personalEmail: {
      type: String,
      required: false,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      required: false,
      default: null,
    },
    address: {
      type: String,
      required: false,
      default: null,
    },
    country: {
      type: String,
      required: false,
      default: null,
    },
    state: {
      type: String,
      required: false,
      default: null,
    },
    city: {
      type: String,
      required: false,
      default: null,
    },
    zipCode: {
      type: String,
      required: false,
      default: null,
    },
    nationality: {
      type: String,
      required: false,
      default: null,
    },
    bankAccountDetails: {
      bankName: {
        type: String,
        required: false,
        default: null,
      },
      accountNumber: {
        type: String,
        required: false,
        default: null,
      },
      accountHolderName: {
        type: String,
        required: false,
        default: null,
      },
      branchName: {
        type: String,
        required: false,
        default: null,
      },
      ifscCode: {
        type: String,
        required: false,
        default: null,
      },
    },
    emergencyContactDetails: {
      name: {
        type: String,
        required: false,
        default: null,
      },
      relationship: {
        type: String,
        required: false,
        default: null,
      },
      phone: {
        type: String,
        required: false,
        default: null,
      },
      email: {
        type: String,
        required: false,
        default: null,
      },
    },
  },
  { timestamps: true }
);

userPersonalInfoSchema.index({ userId: 1 }, { unique: true });
userPersonalInfoSchema.plugin(toJSON);

const UserPersonalInfo = mongoose.model<IUserPersonalInfoDoc, IUserPersonalInfoModel>(
  'UserPersonalInfo',
  userPersonalInfoSchema
);

export default UserPersonalInfo;
