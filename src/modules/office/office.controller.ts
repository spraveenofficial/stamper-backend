import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { organizationService } from '../organization';

export const addOffice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  // check if user have added organization
  // if not, return error

  try {
    const organization = await organizationService.getOrganizationByUserId(id);
    if (!organization) {
      res.status(httpStatus.BAD_REQUEST).json({ message: 'Please add organization first' });
    }
    res.status(httpStatus.OK).json({ message: 'Office added successfully' });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: 'Something went wrong' });
  }
});
