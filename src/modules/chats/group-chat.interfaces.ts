import mongoose, { Document, Model } from 'mongoose';

export interface IGroup {
  name: string; // Group name
  description?: string; // Optional group description
  creator: mongoose.Types.ObjectId; // User who created the group
  participants: IParticipant[]; // List of participants
  createdAt: Date; // Timestamp of group creation
  updatedAt: Date; // Timestamp of last group update
}

export interface IParticipant {
  user: mongoose.Types.ObjectId; // User ID of the participant
  role: ParticipantRole; // Role of the participant (e.g., admin, member)
  joinedAt: Date; // Timestamp when the user joined
  removedAt?: Date | null; // Timestamp when the user was removed (null if active)
}

export interface IParticipantLog {
  group: mongoose.Types.ObjectId; // Reference to the group
  user: mongoose.Types.ObjectId; // User who was added/removed
  action: ParticipantAction; // Action type (added or removed)
  performedBy: mongoose.Types.ObjectId; // User who performed the action
  timestamp: Date; // Timestamp of the action
}

export enum ParticipantRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum ParticipantAction {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
}

export interface IGroupDoc extends IGroup, Document {}
export interface IParticipantLogDoc extends IParticipantLog, Document {}

export interface IGroupModel extends Model<IGroupDoc> {}
export interface IParticipantLogModel extends Model<IParticipantLogDoc> {}
