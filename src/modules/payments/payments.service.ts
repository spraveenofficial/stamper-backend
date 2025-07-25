import { User } from "../user";
import { IPayments, IPaymentsDoc } from "./payments.interfaces";
import Payments from "./payments.model";

export const createPayment = async (payment: any): Promise<IPaymentsDoc> => {
    return await Payments.create(payment);
};

export const createBasePayment = async (payload: IPayments): Promise<IPaymentsDoc> => {

    const payment: IPayments = {
        amount: payload.amount,
        currency: payload.currency,
        userId: payload.userId,
        planId: payload.planId,
        paymentId: payload.paymentId,
        orderId: payload.orderId,
        status: payload.status,
        paymentProvider: payload.paymentProvider,
        organizationId: payload.organizationId,
        errorReason: payload.errorReason,
        errorDescription: payload.errorDescription,
        payment_group: payload.payment_group
    };

    return await Payments.create(payment);
};



export const findUserDetails = async (customerId: string) =>{
    const customerDetail = await User.findById(customerId).select("role");
    return customerDetail;
}

export const existingPaymentDetail = async (gateWay_order_id: string) =>{
    const existingPayment =  await Payments.findOne({ orderId: gateWay_order_id });

    return existingPayment;
}