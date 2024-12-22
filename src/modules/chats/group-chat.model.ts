import mongoose from 'mongoose';
import {
  IGroupDoc,
  IGroupModel,
  IParticipantLogDoc,
  IParticipantLogModel,
  ParticipantAction,
  ParticipantRole,
} from './group-chat.interfaces';
import { toJSON } from '../toJSON';

const ParticipantSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  role: { type: String, enum: Object.values(ParticipantRole), required: true },
  joinedAt: { type: Date, default: Date.now },
  removedAt: { type: Date, default: null },
});

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    groupProfilePic: { type: String, required: false, default: null },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    participants: { type: [ParticipantSchema], default: [] },
  },
  { timestamps: true }
);

const ParticipantLogSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Types.ObjectId, required: true, ref: 'Group' },
    user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    action: { type: String, enum: Object.values(ParticipantAction), required: true },
    performedBy: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

GroupSchema.plugin(toJSON);
ParticipantLogSchema.plugin(toJSON);
ParticipantSchema.plugin(toJSON);

export const ParticipantLog = mongoose.model<IParticipantLogDoc, IParticipantLogModel>(
  'ParticipantLog',
  ParticipantLogSchema
);

export const Group = mongoose.model<IGroupDoc, IGroupModel>('ChatGroup', GroupSchema);
