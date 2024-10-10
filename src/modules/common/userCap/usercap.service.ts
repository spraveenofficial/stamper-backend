import mongoose from 'mongoose';
import { ICapLimitsDoc } from './usercap.interfaces';
import UserCap from './usercap.model';
import { rolesEnum } from '../../../config/roles';
import { CAP_LIMITS_MAPPING, MAX_CAP_LIMITS, ROLE_LIMITS } from '../../../constants/limit_cap';
import { plansInterfaces } from '../plans';

/**
 * Create user cap limit
 * @param {ICapLimitsDoc} capLimit
 * @returns {Promise<ICapLimitsDoc>}
 */

const createUserCap = async (capLimit: Partial<ICapLimitsDoc>): Promise<ICapLimitsDoc | null> => {
  // Assuming there’s a mongoose model `CapLimit` to create a new document
  // Replace with your actual model implementation
  return await UserCap.create(capLimit); // Example Mongoose model usage
};

/**
 *
 * @param userId
 * @param role
 * @param plan
 * @returns
 */
export const addUserCapBasedOnRoleAndPlan = async (
  userId: mongoose.Types.ObjectId,
  role: rolesEnum,
  plan: plansInterfaces.SubscriptionPlanEnum = plansInterfaces.SubscriptionPlanEnum.FREE,
  parentLimitId?: mongoose.Types.ObjectId
): Promise<ICapLimitsDoc | null> => {
  // Define default cap limits
  const defaultCapLimit: Partial<ICapLimitsDoc> = {
    userId,
    addOffice: 0,
    addDepartment: 0,
    addJobTitle: 0,
    addEmployee: 0,
    addManager: 0,
    addFolder: 0,
    addDocument: 0,
    canSubscribeToPlan: false,
    parentLimitId: parentLimitId || null,
  };

  const capLimit: Partial<ICapLimitsDoc> = { ...defaultCapLimit };

  // Get the role-based capabilities
  const roleCapabilities = ROLE_LIMITS[role] || [];

  // Set the limits based on the role and plan, mapping snake_case to camelCase
  roleCapabilities.forEach((cap) => {
    const mappedCap = CAP_LIMITS_MAPPING[cap];
    (capLimit as any)[mappedCap] = MAX_CAP_LIMITS[plan][cap];
  });

  // Special handling for roles
  if (role === rolesEnum.organization) {
    capLimit.canSubscribeToPlan = true; // Organizations can subscribe to plans
  } else if (role === rolesEnum.moderator) {
    // If the user is a moderator, set parentLimitId
    capLimit.parentLimitId = parentLimitId || null;
    // Keep all limits as zero since the moderator will copy limits from the organization
  } else if (role === rolesEnum.employee) {
    // Employees also get their own fresh limits
    // Optionally, add any special limits here for employees
  }

  return createUserCap(capLimit);
};

/**
 *
 * @param userId
 * @returns Promise<ICapLimitsDoc>
 */
export const getCapLimitsByUserId = async (userId: mongoose.Types.ObjectId): Promise<ICapLimitsDoc> => {
  const userCap = await UserCap.findOne({ userId }).select('-_id -__v').lean().exec();

  if (userCap) {
    // Check if the user cap has a parentLimitId
    if (userCap.parentLimitId) {
      // Fetch the parent cap limits if the parentLimitId exists
      const parentCap = await UserCap.findById(userCap.parentLimitId).select('-_id -__v').lean().exec();

      if (parentCap) {
        // Merge parent limits into the current user's limits
        return {
          addOffice: userCap.addOffice || parentCap.addOffice,
          addDepartment: userCap.addDepartment || parentCap.addDepartment,
          addJobTitle: userCap.addJobTitle || parentCap.addJobTitle,
          addEmployee: userCap.addEmployee || parentCap.addEmployee,
          addManager: userCap.addManager || parentCap.addManager,
          addFolder: userCap.addFolder || parentCap.addFolder,
          addDocument: userCap.addDocument || parentCap.addDocument,
          canSubscribeToPlan: userCap.canSubscribeToPlan || parentCap.canSubscribeToPlan,
        } as ICapLimitsDoc;
      }
    }

    // Return the user's own limits if no parent limits are available
    return {
      addOffice: userCap.addOffice,
      addDepartment: userCap.addDepartment,
      addJobTitle: userCap.addJobTitle,
      addEmployee: userCap.addEmployee,
      addManager: userCap.addManager,
      addFolder: userCap.addFolder,
      addDocument: userCap.addDocument,
      canSubscribeToPlan: userCap.canSubscribeToPlan,
    } as ICapLimitsDoc;
  }

  // Return default limits if no user cap is found
  return {
    addOffice: 0,
    addDepartment: 0,
    addJobTitle: 0,
    addEmployee: 0,
    addManager: 0,
    addFolder: 0,
    addDocument: 0,
    canSubscribeToPlan: false,
  } as ICapLimitsDoc; // Explicitly cast this object to match the expected type
};

export const updateCapLimitsByUserIdAndKey = async (
  userId: mongoose.Types.ObjectId,
  key: string,
  value: number
): Promise<ICapLimitsDoc | null> => {
  const response = await UserCap.findOneAndUpdate({ userId }, { [key]: value }, { new: true })
    .select('-_id -__v')
    .lean()
    .exec();

  return response;
};
