import { Document, Model } from 'mongoose';
import { ActionEnum } from '../../config/roles';

export interface IPermission{
  name: string;
  description?: string;
  module: string;
  action: ActionEnum;
}


export interface IPermissionDoc extends IPermission, Document {}
export interface IPermissionModel extends Model<IPermissionDoc>{}