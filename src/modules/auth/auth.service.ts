import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Token from '../token/token.model';
import ApiError from '../errors/ApiError';
import tokenTypes from '../token/token.types';
import { getUserByEmail, getUserById, updateUserById } from '../user/user.service';
import { IUserDoc, OnlyTokenResponse } from '../user/user.interfaces';
import { generateAuthTokens, verifyToken } from '../token/token.service';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<IUserDoc>}
 */
export const loginUserWithEmailAndPassword = async (
  email: string,
  password: string,
  t: (key: string) => string
): Promise<IUserDoc> => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, t('Auth.userNotFound'));
  }
  if (!user.password) {
    throw new ApiError(httpStatus.UNAUTHORIZED, t('Auth.acceptInvitationFirst'));
  }
  if (!(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, t('Auth.invalidCredentials'));
  }
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const logout = async (refreshToken: string, t: (key: string) => string): Promise<void> => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, t('Auth.tokenNotFound'));
  }
  await refreshTokenDoc.deleteOne();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<IUserWithTokens>}
 */
export const refreshAuth = async (refreshToken: string, t: (key: string) => string): Promise<OnlyTokenResponse> => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await getUserById(new mongoose.Types.ObjectId(refreshTokenDoc.user));
    if (!user) {
      throw new Error(t('Auth.userNotFound'));
    }
    await refreshTokenDoc.deleteOne();
    const tokens = await generateAuthTokens(user);
    return { tokens };
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, t('Auth.authenticationRequired'));
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const resetPassword = async (
  resetPasswordToken: any,
  newPassword: string,
  t: (key: string) => string
): Promise<void> => {
  try {
    const resetPasswordTokenDoc = await verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await getUserById(new mongoose.Types.ObjectId(resetPasswordTokenDoc.user));
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, t('Auth.passwordResetFailed'));
    }
    await updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, t('Auth.passwordResetFailed'));
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<IUserDoc | null>}
 */
export const verifyEmail = async (verifyEmailToken: any, t: (key: string) => string): Promise<IUserDoc | null> => {
  try {
    const verifyEmailTokenDoc = await verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await getUserById(new mongoose.Types.ObjectId(verifyEmailTokenDoc.user));
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, t('Auth.emailVerificationFailed'));
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    const updatedUser = await updateUserById(user.id, { isEmailVerified: true });
    return updatedUser;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, t('Auth.emailVerificationFailed'));
  }
};
