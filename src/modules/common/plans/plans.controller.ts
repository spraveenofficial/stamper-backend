import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { plansInterfaces, plansServices } from '.';
import { catchAsync, pick } from '../../utils';
import { convertCurrency } from '../services/currency-service';
import { PlanPriceCurrencyEnum } from './plans.interfaces';

export const createPlan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.user;
    const payload = req.body;

    const createdPlan = await plansServices.createPlan(payload, id);
    res.status(httpStatus.CREATED).json({ success: true, message: 'Plan Created Successfully', data: createdPlan });
});

export const getPlans = catchAsync(async (req: Request, res: Response) => {
    const { currency } = pick(req.query, ['currency']);
    const plans = await plansServices.getPlansToDisplay();

    if (currency && currency !== plansInterfaces.PlanPriceCurrencyEnum.INR) {
        for (const plan of plans) {
            plan.planPrice = await convertCurrency(plan.planPrice, plan.planPriceCurrency, currency as string);
            plan.planPriceCurrency = currency as PlanPriceCurrencyEnum;
        }
    }

    res.status(httpStatus.OK).json({ success: true, data: plans });
});
