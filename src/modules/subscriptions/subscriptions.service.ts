import mongoose, { PipelineStage } from 'mongoose';
import { plansInterfaces, plansServices } from '../common/plans';
import { Organization } from '../organization';
import { ISubscription, SubscriptionStatusEnum } from './subscriptions.interfaces';
import Subscription from './subscriptions.model';

export const createNewSubscription = async (subscriptionData: ISubscription) => {
    return Subscription.create(subscriptionData);
};

export const createTrailSubscriptionForOrganization = async (orgId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) => {
    console.log('Creating trail subscription for organization:', userId);
    const trailPlan = (await plansServices.getTrailPlan()) as plansInterfaces.IPlansDoc;
    const subscriptionData: ISubscription = {
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: orgId,
        planId: trailPlan._id,
        startDate: new Date(),
        endDate: calculateSubscriptionEndDate(trailPlan.planDuration, trailPlan.planDurationUnit),
        status: SubscriptionStatusEnum.ACTIVE,
        isRecurring: false,
        paymentId: null,
    } as ISubscription;

    return createNewSubscription(subscriptionData);
};

export const calculateSubscriptionEndDate = (
    planDuration: number,
    planDurationUnit: plansInterfaces.SubscriptionPlanDurationEnum,
    startDate = new Date()
) => {
    const endDate = new Date(startDate); // Clone the start date

    if (planDurationUnit === plansInterfaces.SubscriptionPlanDurationEnum.DAYS) {
        endDate.setDate(endDate.getDate() + planDuration); // Add days
    } else if (planDurationUnit === plansInterfaces.SubscriptionPlanDurationEnum.MONTHLY) {
        endDate.setMonth(endDate.getMonth() + planDuration); // Add months
    } else if (planDurationUnit === plansInterfaces.SubscriptionPlanDurationEnum.YEARLY) {
        endDate.setFullYear(endDate.getFullYear() + planDuration); // Add years
    }

    return endDate;
};

/**
 * Fetch all subscriptions for a specific organization with detailed plan information.
 *
 * @param {mongoose.Types.ObjectId} organizationId - The ID of the organization.
 * @returns {Promise<Array>} - List of subscriptions with associated plan details.
 */
export const getAllSubscriptionsByOrganizationId = async (
    organizationId: mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    query?: string
) => {
    const skip = (page - 1) * limit;
    // Validate the input
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw new Error('Invalid organization ID provided.');
    }

    const matchQuery: any = {
        organizationId: new mongoose.Types.ObjectId(organizationId),
    }

    if (query) {
        // If query name is active, then filter by active subscriptions else show all cancelled and expired subscriptions
        if (query === 'active') {
            matchQuery['status'] = SubscriptionStatusEnum.ACTIVE;
        } else {
            matchQuery['status'] = { $ne: SubscriptionStatusEnum.ACTIVE };
        }
    }

    const pipeline: PipelineStage[] = [
        {
            $match: matchQuery,
        },
        {
            $lookup: {
                from: 'plans', // Ensure the 'plans' collection exists and is named correctly
                localField: 'planId',
                foreignField: '_id',
                as: 'plan',
            },
        },
        {
            $unwind: {
                path: '$plan',
                preserveNullAndEmptyArrays: true, // Allow subscriptions without plans to still show
            },
        },
        {
            $sort: {
                createdAt: -1, // Sort by the most recently created subscriptions
            },
        },
        {
            $project: {
                _id: 0,
                subscriptionName: '$plan.planName',
                subscriptionDetails: '$plan.planDescription',
                subscriptionStartDate: '$startDate',
                subscriptionEndDate: '$endDate',
                subscriptionStatus: '$status',
                subscriptionId: '$_id',
                subscriptionPlanId: '$plan._id',
                isSubscriptionRecurring: '$isRecurring',
            },
        },
        {
            $facet: {
                metadata: [
                    { $count: 'totalCount' }, // Count total documents
                    { $addFields: { page, limit } }, // Include page and limit in metadata
                ],
                data: [
                    { $skip: skip }, // Skip for pagination
                    { $limit: limit }, // Limit the number of results
                ],
            },
        },
        {
            $unwind: '$metadata', // Unwind the metadata array
        },
        {
            $project: {
                results: '$data',
                page: '$metadata.page',
                limit: '$metadata.limit',
                totalResults: '$metadata.totalCount',
                totalPages: {
                    $ceil: { $divide: ['$metadata.totalCount', '$metadata.limit'] },
                },
            },
        },
    ];

    try {
        const subscriptions = await Subscription.aggregate(pipeline);
        return subscriptions.length > 0 ? subscriptions[0] : { results: [], page, limit, totalResults: 0, totalPages: 0 };
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw new Error('Failed to fetch subscriptions. Please try again later.');
    }
};

export const syncAllOrganizationToTrailPlan = async () => {
    const organizations = await Organization.find({}).select('_id').lean();

    for (const org of organizations) {
        await createTrailSubscriptionForOrganization(org._id, org._id);
    }
};

export const getCurrentSubscriptionForOrganization = async (organizationId: mongoose.Types.ObjectId) => {
    // Validate the input
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw new Error('Invalid organization ID provided.');
    }

    const pipeline: PipelineStage[] = [
        {
            $match: {
                organizationId: new mongoose.Types.ObjectId(organizationId),
                status: SubscriptionStatusEnum.ACTIVE,
            },
        },
        {
            $lookup: {
                from: 'plans', // Ensure the 'plans' collection exists and is named correctly
                localField: 'planId',
                foreignField: '_id',
                as: 'plan',
            },
        },
        {
            $unwind: {
                path: '$plan',
                preserveNullAndEmptyArrays: true, // Allow subscriptions without plans to still show
            },
        },
        {
            $project: {
                _id: 0,
                subscriptionName: '$plan.planName',
                subscriptionDetails: '$plan.planDescription',
                subscriptionStartDate: '$startDate',
                subscriptionEndDate: '$endDate',
                subscriptionStatus: '$status',
                subscriptionId: '$_id',
                subscriptionPlanId: '$plan._id',
                isSubscriptionRecurring: '$isRecurring',
            },
        },
        {
            $limit: 1, // Ensure only one result is returned
        },
    ];

    try {
        const subscription = await Subscription.aggregate(pipeline);
        return subscription.length > 0 ? subscription[0] : null;
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        throw new Error('Failed to fetch current subscription. Please try again later.');
    }
};
