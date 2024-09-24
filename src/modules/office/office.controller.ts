
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';

export const addOffice = catchAsync(async (_req: Request, res: Response) => {
    res.status(httpStatus.OK).json({ message: 'Office added successfully' });
});