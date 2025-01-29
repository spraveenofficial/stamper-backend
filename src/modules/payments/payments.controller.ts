import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Payments, paymentsServices } from '.';
import { rolesEnum } from '../../config/roles';
import catchAsync from '../utils/catchAsync';
import { CashFreePaymentsSolution } from './cashfree.service';
import { AvailablePaymentProviders, IPayments, PaymentStatus } from './payments.interfaces';
import { User } from '../user';

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
    const data = req.body;

    if (!data?.data?.customer_details?.customer_id || !data?.data?.payment_gateway_details?.gateway_order_id) {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid webhook payload" });
    }

    try {
        const findUser = await User.findById(data.data.customer_details.customer_id).select("role");

        if (!findUser) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "User not found" });
        }

        if (findUser.role !== "organization") {
            return res.status(httpStatus.FORBIDDEN).json({ success: false, message: "User is not authorized to update payments" });
        }

        const existingPayment = await Payments.findOne({ orderId: data.data.payment_gateway_details.gateway_order_id });

        if (!existingPayment) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Payment record not found for the given orderId" });
        }

        if (existingPayment.status === data.data.payment.payment_status) {
            return res.status(httpStatus.OK).json({ success: true, message: "Payment status is already updated" });
        }

        existingPayment.status = data.data.payment.payment_status;
        await existingPayment.save();

        return res.status(httpStatus.OK).json({ success: true, message: "Payment status updated successfully" });
    } catch (error: any) {
        console.error("Error processing webhook:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error", error: error.message });
    }
});
