import mongoose from 'mongoose';
import { IGroupDoc, ParticipantAction, ParticipantRole } from './group-chat.interfaces';
import { Group, ParticipantLog } from './group-chat.model';

export const createGroup = async (userId: mongoose.Types.ObjectId, payload: any): Promise<IGroupDoc> => {
  const group = await Group.create({
    ...payload,
    creator: userId,
    participants: [
      {
        user: userId,
        role: ParticipantRole.ADMIN,
        joinedAt: new Date(),
      },
    ],
  });

  // Log the creator as the first participant
  await ParticipantLog.create({
    group: group._id,
    user: userId,
    action: ParticipantAction.ADDED,
    performedBy: userId,
    timestamp: new Date(),
  });

  return group;
};

export const addParticipantToGroup = async (
  groupId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  addedBy: mongoose.Types.ObjectId
): Promise<void> => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found');

  // Add the participant
  group.participants.push({
    user: userId,
    role: ParticipantRole.MEMBER,
    joinedAt: new Date(),
  });

  await group.save();

  // Log the addition
  await ParticipantLog.create({
    group: groupId,
    user: userId,
    action: ParticipantAction.ADDED,
    performedBy: addedBy,
    timestamp: new Date(),
  });
};

export const removeParticipant = async (
  groupId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  removedBy: mongoose.Types.ObjectId
): Promise<void> => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found');

  const participant = group.participants.find((p) => p.user.toString() === userId.toString());
  if (!participant) throw new Error('User not found in the group');

  // Mark the participant as removed
  participant.removedAt = new Date();

  await group.save();

  // Log the removal
  await ParticipantLog.create({
    group: groupId,
    user: userId,
    action: ParticipantAction.REMOVED,
    performedBy: removedBy,
    timestamp: new Date(),
  });
};
