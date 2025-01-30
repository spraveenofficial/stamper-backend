import mongoose, { Document, Model } from "mongoose";

export enum AvailablePaymentProviders {
    CASHFREE = 'CAHSFREE',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ACTIVE = 'ACTIVE',
    USER_DROPPED = "USER_DROPPED",
    CANCELLED = "CANCELLED",
    FLAGGED = "FLAGGED",
    INCOMPLETE = "INCOMPLETE",
    VOID = "VOID",
}

export const PaymentStatusMapping =  {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  ACTIVE: "ACTIVE",
  USER_DROPPED: "USER_DROPPED",
  CANCELLED: "CANCELLED",
  FLAGGED: "FLAGGED",
  INCOMPLETE: "INCOMPLETE",
  VOID: "VOID"
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
    errorReason: string;
    errorDescription: string;
    payment_group: string
}

export interface IPaymentsDoc extends IPayments, Document { }
export interface IPaymentsModel extends Model<IPaymentsDoc> { }



export interface PaymentResponseType {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_tags: any | null;
    };
    payment: {
      cf_payment_id: number;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_message: string;
      payment_time: string;
      bank_reference: string;
      auth_id: string | null;
      payment_method: Record<string, any>;
      payment_group: string;
    };
    customer_details: {
      customer_name: string;
      customer_id: string;
      customer_email: string;
      customer_phone: string;
    };
    error_details?: {
      error_code: string;
      error_description: string;
      error_reason: string;
      error_source: string;
      error_code_raw: string | null;
      error_description_raw: string | null;
    };
    payment_gateway_details: {
      gateway_name: string;
      gateway_order_id: string;
      gateway_payment_id: string;
      gateway_status_code: string | null;
      gateway_order_reference_id: string | null;
      gateway_settlement: any | null;
    };
    payment_offers: any | null;
    event_time: string;
    type: string;
  }
  

