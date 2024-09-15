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
  const user = await userService.registerUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  // res.set('Set-Cookie', [
  //   tokenService.getCookieWithToken(tokens.access.token, 'token'),
  //   tokenService.getCookieWithToken(tokens.refresh.token, 'refreshToken')
  // ]); // Access token as cookie

  res
    .cookie('token', tokens.access.token, {
      httpOnly: true,
      secure: config.env === DevelopmentOptions.production,
      expires: tokens.access.expires,
      sameSite: 'none',
    })
    .cookie('refreshToken', tokens.refresh.token, {
      httpOnly: true,
      secure: config.env === DevelopmentOptions.production,
      expires: tokens.refresh.expires,
      sameSite: 'none',
    })
    .send({ user, tokens }); // Access token as cookie
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
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
