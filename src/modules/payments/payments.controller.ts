import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { paymentsServices } from '.';
import { rolesEnum } from '../../config/roles';
import catchAsync from '../utils/catchAsync';
import { CashFreePaymentsSolution } from './cashfree.service';
import { AvailablePaymentProviders, IPayments, PaymentResponseType, PaymentStatus, PaymentStatusMapping } from './payments.interfaces';
import { ApiError } from '../errors';
// import { existingPaymentDetail, findUserDetails } from './payments.service';
import { existingPaymentDetail, findUserDetails } from './payments.service';

export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.user;
    const { planId, currency } = req.body;
    const { organizationId } = req.organizationContext;
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
    const data: PaymentResponseType = req.body.data;
    console.log("Webhook data is: ", req.body.data.payment);

    if (!data?.customer_details?.customer_id || !data?.payment_gateway_details?.gateway_order_id) {
        return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "Invalid webhook payload" });
    }

    try {
        const findUser = await findUserDetails(data.customer_details.customer_id) 

        if (!findUser) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not found");
        }

        if (findUser.role !== rolesEnum.organization) {
            throw new ApiError(httpStatus.FORBIDDEN, "User is not authorized to update payments");
        }

        const existingPayment = await existingPaymentDetail(data.payment_gateway_details.gateway_order_id) 
        if (!existingPayment) {
            throw new ApiError(httpStatus.NOT_FOUND, "Payment record not found for the given orderId");
        }

        const paymentStatus = data.payment.payment_status as PaymentStatus;

        if (!Object.values(PaymentStatus).includes(paymentStatus)) {
            throw new ApiError(httpStatus.NOT_FOUND, "Invalid payment status received");
        }

        if (existingPayment.status === paymentStatus) {
            return res.status(httpStatus.OK).json({ success: true, message: "Payment status is already updated" });
        }

        if (paymentStatus === PaymentStatusMapping.FAILED && data.error_details) {
            existingPayment.errorReason = data.error_details?.error_reason;
            existingPayment.errorDescription = data.error_details.error_description;
            existingPayment.payment_group = data.payment.payment_group;
            existingPayment.status = paymentStatus;
            await existingPayment.save();
            throw new ApiError(httpStatus.BAD_REQUEST, "Payment Failed");
        }

        if (paymentStatus === PaymentStatusMapping.USER_DROPPED) {
            existingPayment.errorReason = paymentStatus.toLowerCase();
            existingPayment.errorDescription = "Drop out of the payment flow without completing the transaction."
            existingPayment.payment_group = data.payment.payment_group;
            existingPayment.status = paymentStatus;
            await existingPayment.save();
            throw new ApiError(httpStatus.BAD_REQUEST, "Drop out of the payment flow without completing the transaction.");
        }

        
        if (paymentStatus === PaymentStatusMapping.FLAGGED || paymentStatus === PaymentStatusMapping.PENDING || paymentStatus === PaymentStatusMapping.CANCELLED || paymentStatus === PaymentStatusMapping.VOID) {
            existingPayment.errorReason = paymentStatus.toLowerCase();
            existingPayment.errorDescription = "Transaction Failed";
            existingPayment.payment_group = data.payment.payment_group;
            existingPayment.status = paymentStatus;
            await existingPayment.save();
            throw new ApiError(httpStatus.BAD_REQUEST, "Payment Failed");
        }
        
        existingPayment.payment_group = data.payment.payment_group;
        existingPayment.status = paymentStatus;
        await existingPayment.save();

        return res.status(httpStatus.OK).json({ success: true, message: "Payment status updated successfully" });
    } catch (error: any) {
        console.error("Error processing webhook:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error", error: error.message });
    }
});