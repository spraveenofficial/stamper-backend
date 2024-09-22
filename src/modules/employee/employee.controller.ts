import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import { userService } from '../user';
import { ApiError } from '../errors';
import { tokenService, tokenTypes } from '../token';
import { employeeService } from '.';
import { employeeAccountStatus } from './employee.interfaces';

export const updateEmploeeAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const { body } = req;
  const { token } = req.params;
  const isTokenValid = await tokenService.verifyToken(token as string, tokenTypes.INVITATION);

  if (!isTokenValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token is invalid');
  }

  const user = await userService.getUserByEmail(body.email);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User Not Found');
  }
  const updatePassword = await userService.updateUserById(user.id, body);
  await employeeService.updateEmployeeAccountStatus(user.id, employeeAccountStatus.Active);
  await tokenService.deleteToken(token as string);
  res.status(httpStatus.OK).json({ message: 'Employee account status updated successfully', updatePassword });
});
