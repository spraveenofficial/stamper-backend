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
  if (await LeaveType.isLeaveTypeExist(leaveType.leaveType, new mongoose.Types.ObjectId(leaveType.organizationId), new mongoose.Types.ObjectId(leaveType.officeId))) {
    throw new Error(t('LeavePolicies.leaveTypeExist error'));
  }
  return await LeaveType.create(leaveType);
};

export const updateLeaveTypeById = async (
  id: mongoose.Types.ObjectId,
  leaveType: Partial<leavePoliciesInterface.ILeaveType>
): Promise<leavePoliciesInterface.ILeaveTypeDoc | null> => {
  const leaveTypeDoc = await LeaveType.findById(id);
  if (!leaveTypeDoc) {
    return null;
  }
  Object.assign(leaveTypeDoc, leaveType);
  return await leaveTypeDoc.save();
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

  if (leaveType.isOperational) {
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
): Promise<leavePoliciesInterface.ILeaveTypeDoc[]> => await LeaveType.find({ organizationId }).populate('policyId').exec();

export const getOnlyLeaveTypesByOrganizationId = async (
  organizationId: mongoose.Types.ObjectId
): Promise<leavePoliciesInterface.ILeaveTypeDoc[]> =>
  await LeaveType.find({ organizationId }).select('-policyId -organizationId').exec();

/**
 *
 * @param orgId
 * @param userId
 * @returns
 */

export const getLeavesbalanceByOrgAndEmployeeId = async (
  orgId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId // Employee ID
) => {
  const pipeline = [
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(orgId),
        isOperational: true,
      },
    },
    {
      $lookup: {
        from: 'leavepolicies',
        localField: 'policyId',
        foreignField: '_id',
        as: 'policy',
      },
    },
    {
      $unwind: {
        path: '$policy',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'leaves',
        let: { leaveTypeId: '$_id', employeeId: new mongoose.Types.ObjectId(userId) },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$employeeId', '$$employeeId'] }, { $eq: ['$leaveTypeId', '$$leaveTypeId'] }],
              },
            },
          },
          {
            $group: {
              _id: '$status', // Group by leave status
              total: { $sum: { $ifNull: ['$total', 0] } },
              count: { $sum: 1 },
            },
          },
        ],
        as: 'leaveDetails',
      },
    },
    {
      $addFields: {
        approvedLeaves: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$leaveDetails',
                as: 'leave',
                cond: { $eq: ['$$leave._id', 'approved'] },
              },
            },
            0,
          ],
        },
        pendingLeaves: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$leaveDetails',
                as: 'leave',
                cond: { $eq: ['$$leave._id', 'pending'] },
              },
            },
            0,
          ],
        },
        rejectedLeaves: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$leaveDetails',
                as: 'leave',
                cond: { $eq: ['$$leave._id', 'rejected'] },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        id: 1,
        leaveType: 1,
        isPaid: 1,
        isEarned: 1,
        pending: { $ifNull: ['$pendingLeaves.total', 0] }, // Use total from pendingLeaves
        approved: { $ifNull: ['$approvedLeaves.total', 0] }, // Use total from approvedLeaves
        balance: { $subtract: ['$policy.frequencyCount', { $ifNull: ['$approvedLeaves.total', 0] }] }, // Calculate balance
        rejected: { $ifNull: ['$rejectedLeaves.total', 0] }, // Use total from rejectedLeaves
      },
    },
  ];

  return await LeaveType.aggregate(pipeline);
};
