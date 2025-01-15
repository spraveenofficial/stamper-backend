import mongoose, { Document, Model } from 'mongoose';
import { roles } from '../../config/roles';
import { QueryResult } from '../paginate/paginate';
import { IPermission } from '../rbac/rbac.interfaces';
import { AccessAndRefreshTokens } from '../token/token.interfaces';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: typeof roles[number];
  isEmailVerified: boolean;
  profilePic: string | null;
  phoneNumber: string | null;
  permissions: IPermission[];
  deletedAt: Date | null;
}

export interface IUserDoc extends IUser, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDoc> {
  isEmailTaken(email: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateUserBody = Partial<IUser>;

export type NewRegisteredUser = Omit<IUser, 'role' | 'isEmailVerified' | 'profilePic' | 'phoneNumber' | 'permissions' | 'deletedAt'>;

export type NewUserAsEmployee = Omit<IUser, 'isEmailVerified' | 'profilePic' | 'password' | 'role' | 'permissions' | 'deletedAt'>;

export type NewCreatedUser = Omit<IUser, 'isEmailVerified' | 'profilePic' | 'phoneNumber' | 'permissions' | 'deletedAt'>;

export interface IUserWithTokens {
  user: IUserDoc;
  tokens: AccessAndRefreshTokens;
}

export type OnlyTokenResponse = Omit<IUserWithTokens, 'user'>;
