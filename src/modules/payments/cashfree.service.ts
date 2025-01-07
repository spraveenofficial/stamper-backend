import axios, { AxiosResponse } from 'axios';
import httpStatus from 'http-status';
import { DevelopmentOptions } from 'src/config/roles';
import config from '../../config/config';
import { plansServices } from '../common/plans';
import { convertCurrency } from '../common/services/currency-service';
import { ApiError } from '../errors';

class CashFreePaymentGateway {
    private appId: string;
    private secretKey: string;
    private baseUrl: string;

    constructor() {
        this.appId = config.CASHFREE_APP_ID;
        this.secretKey = config.CASHFREE_SECRET_KEY;
        this.baseUrl = config.env === DevelopmentOptions.production ? 'https://api.cashfree.com' : 'https://test.cashfree.com';
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
            customerId: string;
            customerEmail: string;
            customerPhone: string;
        };
        orderNote: string;
        notifyUrl: string;
    }): Promise<any> {
        try {
            const response: AxiosResponse = await axios.post(
                `${this.baseUrl}/api/v2/orders`,
                {
                    order_id: params.orderId,
                    order_currency: params.currency,
                    order_amount: params.amount,
                    customer_details: params.customerDetails,
                    order_note: params.orderNote,
                    notify_url: params.notifyUrl,
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
        const amount =
            plan.planPriceCurrency === currency
                ? plan.planPrice
                : await convertCurrency(plan.planPrice, plan.planPriceCurrency, currency);

        const orderId = `order_${new Date().getTime()}`;
        const customerDetails = {
            customerId: userId,
            customerEmail: 'user@example.com', // Replace with real email
            customerPhone: '9999999999', // Replace with real phone
        };

        const orderNote = `Payment for ${plan.planName}`;
        const notifyUrl = `${this.BACKEND_BASE_URL}/cashfree`;

        return this.paymentGateway.makePayment({
            orderId,
            amount,
            currency,
            customerDetails,
            orderNote,
            notifyUrl,
        });
    }
}
