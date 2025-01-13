import axios, { AxiosResponse } from 'axios';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config/config';
import { DevelopmentOptions } from '../../config/roles';
import { plansServices } from '../common/plans';
import { convertCurrency } from '../common/services/currency-service';
import { ApiError } from '../errors';
import { userService } from '../user';

class CashFreePaymentGateway {
  private appId: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.appId = config.CASHFREE_APP_ID;
    this.secretKey = config.CASHFREE_SECRET_KEY;
    this.baseUrl =
      config.env === DevelopmentOptions.production ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
  }

  /**
   * Makes a payment request to Cashfree
   * @param params - Payment parameters
   */
  async makePayment(params: {
    orderId: string;
    amount: number;
    currency: string;
    customerDetails: {
      customer_name: string;
      customer_id: string;
      customer_email: string;
      customer_phone: string;
    };
    orderNote: string;
    order_meta: {
      notify_url: string;
    };
  }): Promise<any> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/orders`,
        {
          order_id: params.orderId,
          order_currency: params.currency,
          order_amount: params.amount,
          customer_details: params.customerDetails,
          order_note: params.orderNote,
          order_meta: params.order_meta,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': this.appId,
            'x-client-secret': this.secretKey,
            'x-api-version': '2023-08-01',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error while making payment:', error.response?.data || error.message);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment initialization failed');
    }
  }

  /**
   * Verifies the payment status from Cashfree
   * @param orderId - The order ID of the payment
   */
  async verifyPayment(orderId: string): Promise<any> {
    try {
      const response: AxiosResponse = await axios.get(`${this.baseUrl}/api/v2/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error while verifying payment:', error.response?.data || error.message);
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment verification failed');
    }
  }
}

export class CashFreePaymentsSolution {
  private paymentGateway: CashFreePaymentGateway;
  // @ts-ignore
  private BACKEND_BASE_URL: string;

  constructor() {
    this.paymentGateway = new CashFreePaymentGateway();
    this.BACKEND_BASE_URL =
      config.env === DevelopmentOptions.production
        ? 'https://api.stamper.tech/api/v1/payments/webhook'
        : 'http://localhost:4500/api/v1/payments/webhook';
  }

  /**
   * Handles the payment process
   * @param planId - ID of the selected plan
   * @param userId - ID of the user making the payment
   * @param currency - Currency for the payment
   */
  async handlePayment(planId: string, userId: string, currency: string): Promise<any> {
    // Fetch plan details
    const plan = await plansServices.getPlanById(planId);

    if (!plan) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
    }

    if (plan && !plan.isActive) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Plan is not active');
    }

    const user = await userService.getUserById(new mongoose.Types.ObjectId(userId));
    const amount =
      plan.planPriceCurrency === currency
        ? plan.planPrice
        : await convertCurrency(plan.planPrice, plan.planPriceCurrency, currency);

    const orderId = `order_${new Date().getTime()}`;
    const customerDetails = {
      customer_name: user?.name as string, // Replace with real name
      customer_id: userId,
      customer_email: user?.email as string, // Replace with real email
      customer_phone: (user?.phoneNumber as string) ?? '8299558807', // Replace with real phone
    };
    const orderNote = `Payment for ${plan.planName}`;
    const order_meta = {
      notify_url: 'https://webhook.site/b4bf7ce2-c3da-4bf4-af35-e77a2be77f6b',
    };
    return this.paymentGateway.makePayment({
      orderId,
      amount,
      currency,
      customerDetails,
      orderNote,
      order_meta,
    });
  }
}
