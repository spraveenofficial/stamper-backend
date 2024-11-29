import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { tokenService, tokenTypes } from '../token';
import { userService } from '../user';
import * as authService from './auth.service';
import { emailService } from '../email';
import config from '../../config/config';
import { DevelopmentOptions } from '../../config/roles';
import { ApiError } from '../errors';
import { CookieOptions } from 'express';

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUserAsOrganization(req.body, req.t);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ success: true, message: req.t('Auth.signupSuccess'), user, tokens });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const host = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
  const isLocal = host!.includes('localhost');
  const domain = isLocal ? undefined : 'stamper.tech'; // Use `undefined` for localhost

  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password, req.t);
  const tokens = await tokenService.generateAuthTokens(user);

  // Ensure tokens have expiration times in milliseconds
  const accessMaxAge =
    tokens.access.expires instanceof Date ? tokens.access.expires.getTime() - Date.now() : tokens.access.expires;

  const refreshMaxAge =
    tokens.refresh.expires instanceof Date ? tokens.refresh.expires.getTime() - Date.now() : tokens.refresh.expires;

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: req.secure || !isLocal, // Secure for HTTPS in production
    domain: domain, // undefined for local, actual domain for production
    sameSite: 'none', // Lax for local, None for cross-site
    path: '/', // Cookies are accessible site-wide
    maxAge: accessMaxAge, // Ensure maxAge is in milliseconds
  };
  // Ensure tokens are strings
  const accessToken = String(tokens.access.token);
  const refreshToken = String(tokens.refresh.token);

  // Set cookies
  res.cookie('token', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: refreshMaxAge });

  return res.status(httpStatus.OK).json({
    success: true,
    message: req.t('Auth.loginSuccess'),
    user,
    tokens,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  // Determine the domain for cookie clearing
  const host: any = req.headers.host ? req.headers.host.split(':')[0] : ('localhost' as string);
  const domain = host.includes('localhost') ? 'localhost' : '.stamper.tech'; // Ensure cross-subdomain compatibility

  // Call your auth service to log out the user (e.g., invalidating refresh token)
  await authService.logout(req.body.refreshToken, req.t);

  // Clear the cookies by using res.clearCookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: req.secure, // Ensure secure flag is set if you're using HTTPS
    domain: domain,
    sameSite: 'none', // Needed for cross-site cookie clearing
    path: '/',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: req.secure,
    domain: domain,
    sameSite: 'none',
    path: '/',
  });

  // Send a success response
  res.status(httpStatus.OK).json({
    success: true,
    message: req.t('Auth.logoutSuccess'),
  });
});

export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const userWithTokens = await authService.refreshAuth(req.body.refreshToken, req.t);
  const host: any = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
  const domain = host.includes('localhost') ? 'localhost' : 'stamper.tech';
  // Set cookies for access and refresh tokens
  res.setHeader('Set-Cookie', [
    tokenService.getCookieWithToken(userWithTokens.tokens.access.token, 'token', domain, req.secure),
    tokenService.getCookieWithToken(userWithTokens.tokens.refresh.token, 'refreshToken', domain, req.secure),
  ]);

  res.send({ ...userWithTokens });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { name, token } = await tokenService.generateResetPasswordToken(req.body.email, req.t);
  if (config.env == DevelopmentOptions.production) {
    await emailService.sendForgotPasswordEmail(req.body.email, token, name);
  }
  console.log('Reset password token: ', token);
  res.status(httpStatus.OK).send({ success: true, message: req.t('Auth.resetPasswordEmailSent') });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query['token'], req.body.password, req.t);
  res.status(httpStatus.OK).json({ success: true, message: req.t('Auth.passwordResetSuccess') });
});

export const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user.id);
  if (user!.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Auth.emailAlreadyVerified'));
  }
  const isTokenAlreadySent = await tokenService.isTokenExists(req.user.id as string, tokenTypes.VERIFY_EMAIL);
  if (isTokenAlreadySent) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Auth.emailVerificationAlreadySent'));
  }
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user!);
  if (config.env == DevelopmentOptions.production) {
    await emailService.sendVerificationEmail(req.user.email, verifyEmailToken, req.user.name);
  }
  res.status(httpStatus.OK).json({ success: true, message: req.t('Auth.emailVerificationEmailSent') });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.query['token'], req.t);
  res.status(httpStatus.OK).json({ success: true, message: req.t('Auth.emailVerificationSuccess') });
});
