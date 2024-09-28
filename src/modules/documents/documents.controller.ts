import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';

export const createFolder = catchAsync(async (_req: Request, res: Response) => {
  res.status(httpStatus.CREATED).json({ success: true, data: {} });
});
