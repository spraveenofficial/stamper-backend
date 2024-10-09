import mongoose, { CallbackError } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { rolesEnum } from '../../config/roles';
import { IUserDoc, IUserModel } from './user.interfaces';
import { plansInterfaces } from '../common/plans';
import { userCapService } from '../common/userCap';

const userSchema = new mongoose.Schema<IUserDoc, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: false,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    profilePic: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: rolesEnum,
      default: 'organization',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (value : any) {
          // Allow null or string values
          return value === null || typeof value === 'string';
        },
        message: 'Expected a string or null for phoneNumber',
      },
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.static('isEmailTaken', async function (email: string, excludeUserId?: mongoose.ObjectId): Promise<boolean> {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
});

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.method('isPasswordMatch', async function (password: string): Promise<boolean> {
  const user = this;
  return bcrypt.compare(password, user.password);
});

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * Post-save hook to create user cap limits based on role and plan
 */
userSchema.post('save', async function (user, next) {
  try {
    // Assign the role and default plan (e.g., FREE plan)
    const role = user.role;
    const plan = plansInterfaces.SubscriptionPlanEnum.FREE; // You can set the default plan

    // Call the function to add cap limits for the user
    await userCapService.addUserCapBasedOnRoleAndPlan(user._id as mongoose.Types.ObjectId, role as rolesEnum, plan);
  } catch (error) {
    next(error as CallbackError); // Cast error to CallbackError to ensure correct type
    return; // Ensure the middleware does not continue if an error occurred
  }
  next();
});

const User = mongoose.model<IUserDoc, IUserModel>('User', userSchema);

export default User;
