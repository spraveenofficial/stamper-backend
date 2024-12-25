import mongoose from 'mongoose';
import { IPermissionDoc, IPermissionModel } from './rbac.interfaces';
import { ActionEnum } from '../../config/roles';
import { toJSON } from '../toJSON';

const Schema = mongoose.Schema;

const permissionSchema = new Schema<IPermissionDoc, IPermissionModel>({
  name: { type: String, required: true, unique: true },
  description: String,
  module: { type: String, required: true },
  action: {
    type: String,
    required: true,
    enum: Object.values(ActionEnum),
  },
});

permissionSchema.plugin(toJSON);

permissionSchema.index({ id: 1 });
permissionSchema.index({ module: 1, action: 1 }, { unique: true });

export const Permission = mongoose.model<IPermissionDoc, IPermissionModel>('UserPermission', permissionSchema);
