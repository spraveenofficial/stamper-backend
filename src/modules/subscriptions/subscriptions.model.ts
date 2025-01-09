import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { ISubscriptionDoc, ISubscriptionModel } from './subscriptions.interfaces';

const Schema = mongoose.Schema;

const subscriptionSchema = new Schema<ISubscriptionDoc, ISubscriptionModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'Plans',
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        paymentId: {
            type: Schema.Types.ObjectId,
            ref: 'Payments',
            default: null,
            required: false,
        },
        isRecurring: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

subscriptionSchema.plugin(toJSON);

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ organizationId: 1 });
subscriptionSchema.index({ planId: 1 });

subscriptionSchema.index({ userId: 1, organizationId: 1, planId: 1 }, { unique: true });


const Subscription = mongoose.model<ISubscriptionDoc, ISubscriptionModel>('Subscription', subscriptionSchema);


export default Subscription;