import mongoose from 'mongoose';
import { leavePoliciesInterface } from './';
import { LeaveType, LeavePolicy } from './leavePolicies.model';

/**
 * Create a leave type
 * @param {leavePoliciesInterface.ILeaveType} leaveType
 * @param {Function} t
 * @returns {Promise<leavePoliciesInterface.ILeaveTypeDoc>}
 */
export const createLeaveType = async (
  leaveType: leavePoliciesInterface.ILeaveType,
  t: (key: string) => string
): Promise<leavePoliciesInterface.ILeaveTypeDoc> => {
  if (await LeaveType.isLeaveTypeExist(leaveType.leaveType, new mongoose.Types.ObjectId(leaveType.organizationId))) {
    throw new Error(t('LeavePolicies.leaveTypeExist error'));
  }
  return await LeaveType.create(leaveType);
};

/**
 *
 * @param leavePolicy
 * @param t
 * @returns
 */
export const createLeavePolicy = async (
  leavePolicy: leavePoliciesInterface.ILeavePolicyType,
  t: (key: string) => string
): Promise<leavePoliciesInterface.ILeavePolicyTypeDoc> => {
  const leaveType = await LeaveType.findById(leavePolicy.leaveTypeId);
  if (!leaveType) {
    throw new Error(t('LeavePolicies.leaveTypeNotExist error'));
  }

  if(leaveType.isOperational){
    throw new Error(t('LeavePolicies.leaveTypeOperational error'));
  }
  
  const leavePolicyResponse = await LeavePolicy.create(leavePolicy);

  leaveType.policyId = leavePolicyResponse._id;
  leaveType.isOperational = true;
  await leaveType.save();
  return leavePolicyResponse as leavePoliciesInterface.ILeavePolicyTypeDoc;
};

/**
 *
 * @param id
 * @returns
 */
export const getLeaveTypeById = async (id: mongoose.Types.ObjectId): Promise<leavePoliciesInterface.ILeaveTypeDoc | null> =>
  await LeaveType.findById(id).populate('policyId').exec();



export const getLeaveTypesByOrganizationId = async (
    organizationId: mongoose.Types.ObjectId
    ): Promise<leavePoliciesInterface.ILeaveTypeDoc[]> => await LeaveType
    .find({ organizationId })
    .populate('policyId')
    .exec();


export const getOnlyLeaveTypesByOrganizationId = async (
    organizationId: mongoose.Types.ObjectId
    ): Promise<leavePoliciesInterface.ILeaveTypeDoc[]> => await LeaveType
    .find({ organizationId }).select('-policyId -organizationId')
    .exec();