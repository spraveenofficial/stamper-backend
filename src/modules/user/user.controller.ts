import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { rolesEnum } from '../../config/roles';
import { userCapService } from '../common/userCap';
import { employeeService } from '../employee';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { IOptions } from '../paginate/paginate';
import { s3Services } from '../s3';
import catchAsync from '../utils/catchAsync';
import pick from '../utils/pick';
import * as userService from './user.service';

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUserAsOrganization(req.body, req.t);
  res.status(httpStatus.CREATED).send(user);
});

export const getSelfUser = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;

  console.log('Current user id: ', id);
  const user = await userService.getUserById(id);

  if (role === rolesEnum.organization) {
    const organization = await organizationService.getOrganizationByUserId(id);
    res.send({ user, organization });
  } else {
    const employeeInformation = await employeeService.getEmployeeByUserId(id);
    const organization = await organizationService.getOrganizationById(employeeInformation!.organizationId);
    res.send({ user, employeeInformation, organization });
  }
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

// export const getUser = catchAsync(async (req: Request, res: Response) => {
//   if (typeof req.params['userId'] === 'string') {
//     const user = await userService.getUserById(new mongoose.Types.ObjectId(req.params['userId']));
//     const organization = await userService.getOrganizationByUserId(new mongoose.Types.ObjectId(req.params['userId']));
//     if (!user) {
//       throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
//     }
//     res.send({ user, organization });
//   }
// });

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

  let capLimits;
  if (role === rolesEnum.organization) {
    capLimits = await userCapService.getCapLimitsByOrgId(req.organization.id);
  } else {
    if ('officeId' in req.organization) {
      capLimits = await userCapService.getCapLimitsByOrgId(req.organization.organizationId);
    }
  }

  const response = {
    limit: capLimits,
    // other data
  };

  res.status(httpStatus.OK).json({ success: true, message: 'Cap limits fetched successfully', data: response });
});
