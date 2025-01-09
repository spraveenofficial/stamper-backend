import mongoose from 'mongoose';
import { rolesEnum } from '../../../config/roles';
import { CAP_LIMITS_MAPPING, MAX_CAP_LIMITS, ROLE_LIMITS } from '../../../constants/limit_cap';
import { plansInterfaces } from '../plans';
import { ICapLimitsDoc } from './usercap.interfaces';
import UserCap from './usercap.model';

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
  organizationId: mongoose.Types.ObjectId,
  role: rolesEnum,
  plan: plansInterfaces.SubscriptionPlanEnum = plansInterfaces.SubscriptionPlanEnum.FREE
): Promise<ICapLimitsDoc | null> => {
  // Define default cap limits
  const defaultCapLimit: Partial<ICapLimitsDoc> = {
    organizationId,
    addOffice: 0,
    addDepartment: 0,
    addJobTitle: 0,
    addEmployee: 0,
    addManager: 0,
    addFolder: 0,
    addDocument: 0,
    canSubscribeToPlan: true,
  };

  const capLimit: Partial<ICapLimitsDoc> = { ...defaultCapLimit };

  // Get the role-based capabilities
  const roleCapabilities = ROLE_LIMITS[role] || [];

  // Set the limits based on the role and plan, mapping snake_case to camelCase
  roleCapabilities.forEach((cap) => {
    const mappedCap = CAP_LIMITS_MAPPING[cap];
    (capLimit as any)[mappedCap] = MAX_CAP_LIMITS[plan][cap];
  });
  return createUserCap(capLimit);
};

/**
 *
 * @param userId
 * @returns Promise<ICapLimitsDoc>
 */
export const getCapLimitsByOrgId = async (orgId: mongoose.Types.ObjectId): Promise<ICapLimitsDoc> => {
  const userCap = await UserCap.findOne({ organizationId: new mongoose.Types.ObjectId(orgId) }).select('-_id -__v').lean().exec();

  if (userCap) {
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

/**
 * Updates the cap limit for a specific organization and key by decrementing it by 1.
 *
 * @param orgId - The organization ID
 * @param key - The cap limit field to update
 * @param decrementBy - The value to decrement (default is 1)
 */
export const updateCapLimitsByOrgIdAndKey = async (
  orgId: mongoose.Types.ObjectId,
  key: keyof ICapLimitsDoc,
  decrementBy: number = 1
): Promise<void> => {
  const allowedKeys: (keyof ICapLimitsDoc)[] = [
    'addOffice',
    'addDepartment',
    'addJobTitle',
    'addEmployee',
    'addManager',
    'addFolder',
    'addDocument',
  ];

  if (!allowedKeys.includes(key)) {
    throw new Error(`Invalid key: ${key}. Allowed keys are: ${allowedKeys.join(', ')}`);
  }

  // Decrement the cap limit by the specified amount
  const result = await UserCap.updateOne(
    { organizationId: orgId, [key]: { $gt: 0 } }, // Ensure the value is greater than 0
    { $inc: { [key]: -decrementBy } }
  ).exec();

  if (result.modifiedCount === 0) {
    throw new Error(`Failed to decrement the cap limit for key: ${key}. It may already be 0.`);
  }
};

/**
 * Checks if a specific cap limit has been reached for an organization.
 *
 * @param orgId - The organization ID
 * @param key - The key representing the cap field to check
 * @returns A promise that resolves to `true` if the cap limit has been reached, otherwise `false`
 */
export const isCapLimitReached = async <T extends keyof ICapLimitsDoc>(
  orgId: mongoose.Types.ObjectId,
  key: T
): Promise<boolean> => {
  // Fetch the specific cap value for the given key
  const userCap = await UserCap.findOne({ organizationId: orgId })
    .select({ [key]: 1 }) // Dynamically select the field
    .lean()
    .exec();

  // Return true if the cap limit is reached (0 or false), false otherwise
  return userCap ? userCap[key] === 0 || userCap[key] === false : false;
};
