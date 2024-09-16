import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as userService from './user.service';
import { employeeService } from '../employee';

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUserAsOrganization(req.body);
  res.status(httpStatus.CREATED).send(user);
});

export const getSelfUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user.id);
  if (req.user.role === 'organization') {
    const organization = await userService.getOrganizationByUserId(req.user.id);
    res.send({ user, organization });
  } else {
    const employeeInformation = await employeeService.getEmployeeByUserId(req.user.id);
    const organization = await userService.getOrganizationByUserId(employeeInformation.managerId);
    res.send({ user, employeeInformation, organization });
  }
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(req.params['userId']));
    const organization = await userService.getOrganizationByUserId(new mongoose.Types.ObjectId(req.params['userId']));
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send({ user, organization });
  }
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    const user = await userService.updateUserById(new mongoose.Types.ObjectId(req.params['userId']), req.body);
    res.send(user);
  }
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    await userService.deleteUserById(new mongoose.Types.ObjectId(req.params['userId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});
