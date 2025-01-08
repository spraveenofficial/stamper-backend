import { IPayments, IPaymentsDoc } from "./payments.interfaces";
import Payments from "./payments.model";

export const createPayment = async (payment: any): Promise<IPaymentsDoc> => {
    return await Payments.create(payment);
};

export const createBasePayment = async (payload: any): Promise<IPaymentsDoc> => {

    const payment: IPayments = {
        amount: payload.amount,
        currency: payload.currency,
        userId: payload.userId,
        planId: payload.planId,
        paymentId: payload.paymentId,
        orderId: payload.orderId,
        status: payload.status,
        paymentProvider: payload.paymentProvider,
        organizationId: payload.organizationId
    };

    return await Payments.create(payment);
};
