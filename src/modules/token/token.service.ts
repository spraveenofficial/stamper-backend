import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import config from '../../config/config';
import Token from './token.model';
import ApiError from '../errors/ApiError';
import tokenTypes from './token.types';
import { AccessAndRefreshTokens, ITokenDoc } from './token.interfaces';
import { IUserDoc } from '../user/user.interfaces';
import { userService } from '../user';

/**
 * Generate token
 * @param {mongoose.Types.ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
export const generateToken = (
  userId: mongoose.Types.ObjectId,
  expires: Moment,
  type: string,
  secret: string = config.jwt.secret,
  role: string
): string => {
  const payload = {
    id: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    role: role,
  };
  return jwt.sign(payload, secret);
};

export const getCookieWithToken = (token: string, tokenName: string, domainName: string, isSecure: boolean): string => {
  const isProduction = process.env['NODE_ENV'] === 'production';

  // Determine if it's secure (use Secure only in production)
  const secureFlag = isSecure ? 'Secure;' : 'Secure;';
  const sameSite = isProduction ? 'SameSite=None;' : 'SameSite=Lax;';
  // Use Domain only in production
  const domain = domainName === 'localhost' ? '' : `Domain=${domainName};`;

  return `${tokenName}=${token}; HttpOnly; Path=/; Max-Age${
    config.jwt.accessExpirationMinutes * 60
  }; ${domain} ${sameSite} ${secureFlag}`;
};

export const getCookieForLogout = (tokenName: string, domainName: string, isSecure: boolean): string => {
  const isProduction = process.env['NODE_ENV'] === 'production';

  // Determine if it's secure (use Secure only in production)
  const secureFlag = isSecure ? 'Secure;' : '';
  const sameSite = isProduction ? 'SameSite=None;' : 'SameSite=Lax;';
  // Use Domain only in production
  const domain = domainName === 'localhost' ? '' : `Domain=${domainName};`;

  // Set expiration to a past date to invalidate the cookie
  const expires = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT;';

  return `${tokenName}=; HttpOnly; Path=/; ${expires} ${domain} ${sameSite} ${secureFlag}`;
};


/**
 * Save a token
 * @param {string} token
 * @param {mongoose.Types.ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<ITokenDoc>}
 */
export const saveToken = async (
  token: string,
  userId: mongoose.Types.ObjectId,
  role: string,
  expires: Moment,
  type: string,
  blacklisted: boolean = false
): Promise<ITokenDoc> => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    role: role,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<ITokenDoc>}
 */
export const verifyToken = async (token: string, type: string): Promise<ITokenDoc> => {
  const payload: any = jwt.verify(token, config.jwt.secret);
  if (typeof payload.id !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'bad user');
  }
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.id,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {IUserDoc} user
 * @returns {Promise<AccessAndRefreshTokens>}
 */
export const generateAuthTokens = async (user: IUserDoc): Promise<AccessAndRefreshTokens> => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS, config.jwt.secret, user.role);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH, config.jwt.secret, user.role);
  await saveToken(refreshToken, user.id, user.role, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
export const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, tokenTypes.RESET_PASSWORD, config.jwt.secret, user.role);
  await saveToken(resetPasswordToken, user.id, user.role, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {IUserDoc} user
 * @returns {Promise<string>}
 */
export const generateVerifyEmailToken = async (user: IUserDoc): Promise<string> => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL, config.jwt.secret, user.role);
  await saveToken(verifyEmailToken, user.id, user.role, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};
