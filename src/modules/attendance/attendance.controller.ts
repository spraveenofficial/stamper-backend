import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../utils';

export const createAttendanceConfigForOffice = catchAsync(async (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({ success: true, message: 'Attendance Config Created' });
});