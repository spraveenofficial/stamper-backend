import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { subscriptionServices } from '.';
import { pick } from '../utils';
import catchAsync from '../utils/catchAsync';

export const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
    const { organizationId } = req.organizationContext;
    const { page, limit, query } = pick(req.query, ['page', 'limit', 'query']);
    
    const paginationFilter = {
        page: Math.max(1, +page || 1),
        limit: Math.max(1, +limit || 10),
    };

    const response = await subscriptionServices.getAllSubscriptionsByOrganizationId(organizationId as mongoose.Types.ObjectId, paginationFilter.page, paginationFilter.limit, query);
    res.status(httpStatus.OK).json({ success: true, message: req.t('Common.successRequest'), data: response });
});