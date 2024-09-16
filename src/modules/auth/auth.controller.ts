import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { tokenService } from '../token';
import { userService } from '../user';
import * as authService from './auth.service';
import { emailService } from '../email';
import config from '../../config/config';
import { DevelopmentOptions } from '../../config/roles';

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUserAsOrganization(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  // Determine the domain based on the request host
  const host: any = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
  const domain = host.includes('localhost') ? 'localhost' : 'stamper.tech';

  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  // Set cookies for access and refresh tokens
  res.setHeader('Set-Cookie', [
    tokenService.getCookieWithToken(tokens.access.token, 'token', domain, req.secure),
    tokenService.getCookieWithToken(tokens.refresh.token, 'refreshToken', domain, req.secure),
  ]);

  // Send response after setting the cookies
  return res.status(httpStatus.OK).json({ user, tokens });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.OK).json({ message: 'Logged out' });
});

export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const userWithTokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...userWithTokens });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  if (config.env == DevelopmentOptions.production) {
    await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  }
  console.log("Reset password token: ", resetPasswordToken);
  res.status(httpStatus.OK).send({ message: 'Password reset email sent' });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query['token'], req.body.password);
  res.status(httpStatus.OK).json({ message: 'Password reset successful' });
});

export const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  if (config.env == DevelopmentOptions.production) {
    await emailService.sendVerificationEmail(req.user.email, verifyEmailToken, req.user.name);
  }
  res.status(httpStatus.NO_CONTENT).send();
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.query['token']);
  res.status(httpStatus.NO_CONTENT).send();
});
