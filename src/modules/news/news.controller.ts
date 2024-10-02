import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';

export const createNews = catchAsync(async (_req: Request, res: Response) => {
  res.status(httpStatus.CREATED).send();
});
