import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { AvailablePaymentProviders, IPaymentsDoc, IPaymentsModel, PaymentStatus } from './payments.interfaces';

const Schema = mongoose.Schema;

const paymentsSchema = new Schema<IPaymentsDoc, IPaymentsModel>(
    {
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        planId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Plans',
        },
        paymentId: {
            type: String,
            required: true,
        },
        orderId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            required: true,
        },
        paymentProvider: {
            type: String,
            enum: Object.values(AvailablePaymentProviders),
            required: true,
        },
    },
    { timestamps: true }
);

paymentsSchema.plugin(toJSON);

const Payments = mongoose.model<IPaymentsDoc, IPaymentsModel>('Payments', paymentsSchema);

export default Payments;
