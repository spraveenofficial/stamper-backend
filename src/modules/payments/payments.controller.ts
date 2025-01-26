import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { paymentsServices } from '.';
import { rolesEnum } from '../../config/roles';
import catchAsync from '../utils/catchAsync';
import { CashFreePaymentsSolution } from './cashfree.service';
import { AvailablePaymentProviders, IPayments, PaymentStatus } from './payments.interfaces';

export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const { id, role } = req.user;
    const { planId, currency } = req.body;

    let organizationId;
    if (role === rolesEnum.organization) {
        organizationId = req.organization.id;
    } else if ('officeId' in req.organization) {
        organizationId = req.organization.organizationId;
    }
    const cashFreePaymentService = new CashFreePaymentsSolution();

    try {
        const response = await cashFreePaymentService.handlePayment(planId, id, currency);
        // Create a payment record in the database @ts-ignore
        //@ts-ignore
        const payloadForBasePaymentInitiation: IPayments = {
            organizationId,
            userId: id,
            planId,
            currency,
            paymentId: null,
            orderId: response.cf_order_id,
            status: PaymentStatus.PENDING,
            amount: response.order_amount,
            paymentProvider: AvailablePaymentProviders.CASHFREE,
        }

        await paymentsServices.createBasePayment(payloadForBasePaymentInitiation);
        res.status(httpStatus.OK).json({ success: true, message: 'Payment initiated successfully', data: response });
    } catch (error: any) {
        res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error.message });
    }
});


export const paymentsWebhook = catchAsync(async (req: Request, res: Response) => {
    console.log('Webhook received:', req.body);


    return res.status(httpStatus.OK).json({ success: true, message: 'Webhook received' });
});