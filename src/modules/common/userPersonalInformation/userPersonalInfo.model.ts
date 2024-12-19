import mongoose from 'mongoose';
import {
  IBankAccountDetailsDoc,
  IBankAccountDetailsModel,
  IEmergencyContactDetailsDoc,
  IEmergenyContactDetailsModel,
  IUserPersonalInfoDoc,
  IUserPersonalInfoModel,
  MaritalStatusEnum,
} from './userPersonalInfo.interface';
import { toJSON } from '../../../modules/toJSON';

const Schema = mongoose.Schema;

const userEmergencyContactDetailsSchema = new Schema<IEmergencyContactDetailsDoc, IEmergenyContactDetailsModel>(
  {
    name: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const userBankAccountDetailsSchema = new Schema<IBankAccountDetailsDoc, IBankAccountDetailsModel>(
  {
    bankName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    branchName: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

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
      // enum: Object.values(GenderEnum),
      required: false,
      default: null,
    },
    maritalStatus: {
      type: String,
      enum: MaritalStatusEnum,
      required: false,
      // default: null,
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
      type: [userBankAccountDetailsSchema],
      required: false,
      default: [],
    },
    emergencyContactDetails: {
      type: [userEmergencyContactDetailsSchema],
      required: false,
      default: [],
    }
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
