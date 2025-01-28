import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { rolesEnum } from '../../config/roles';
import { userCapService } from '../common/userCap';
import { ApiError } from '../errors';
import { IOptions } from '../paginate/paginate';
import { s3Services } from '../s3';
import { subscriptionServices } from '../subscriptions';
import catchAsync from '../utils/catchAsync';
import pick from '../utils/pick';
import * as userService from './user.service';

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUserAsOrganization(req.body, req.t);
  res.status(httpStatus.CREATED).send(user);
});

export const getSelfUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const user = await userService.getUserById(id);
  return res.json({ success: true, message: "Success", data: user })
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

export const updateSelfUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const user = await userService.updateUserById(id, req.body);
  res.status(httpStatus.OK).json({ message: 'User updated successfully', user });
});

export const updateProfilePicture = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const uploadedUrl = await s3Services.uploadUserProfilePicture(req.file!, id);
  const user = await userService.updateProfilePicture(id, uploadedUrl);
  res.status(httpStatus.OK).json({ message: 'Profile picture updated successfully', user });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const user = await userService.getUserById(id);

  if (req.body.oldPassword === req.body.newPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be different from old password');
  }

  if (!(await user?.isPasswordMatch(req.body.oldPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect password');
  }

  await userService.updateUserById(id, { password: req.body.newPassword });

  res.status(httpStatus.OK).json({ success: true, message: 'Password changed successfully' });
});

export const getUserCapLimits = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;

  let orgId;
  if (role === rolesEnum.organization) {
    orgId = req.organization.id;
  } else {
    if ('officeId' in req.organization) {
      orgId = req.organization.organizationId;
    }
  }

  const [limit, subscription] = await Promise.all([
    userCapService.getCapLimitsByOrgId(orgId),
    subscriptionServices.getCurrentSubscriptionForOrganization(orgId),
  ]);

  const response = {
    limit,
    subscription
  };

  res.status(httpStatus.OK).json({ success: true, message: 'Cap limits fetched successfully', data: response });
});
