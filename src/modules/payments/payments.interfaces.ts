import mongoose, { Document, Model } from "mongoose";

export enum AvailablePaymentProviders {
    CASHFREE = 'CAHSFREE',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ACTIVE = 'ACTIVE',
}


export interface IPayments {
    amount: number;
    currency: string;
    userId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    orderId: string;
    paymentId: string | null;
    status: PaymentStatus;
    paymentProvider: AvailablePaymentProviders;
}

export interface IPaymentsDoc extends IPayments, Document { }
export interface IPaymentsModel extends Model<IPaymentsDoc> { }