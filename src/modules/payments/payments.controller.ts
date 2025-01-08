import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { rolesEnum } from '../../config/roles';
import { CashFreePaymentsSolution } from './cashfree.service';

export const initiatePayment = async (req: Request, res: Response) => {
    const { id, role } = req.user;
    const { planId, currency } = req.body;

    let organizationId;
    if (role === rolesEnum.organization) {
        organizationId = req.organization.id;
    } else if ('officeId' in req.organization) {
        organizationId = req.organization.organizationId;
    }

    console.log('organizationId:', organizationId);
    const cashFreePaymentService = new CashFreePaymentsSolution();

    try {
        const response = await cashFreePaymentService.handlePayment(planId, id, currency);
        res.status(httpStatus.OK).json({ success: true, message: 'Payment initiated successfully', data: response });
    } catch (error: any) {
        res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error.message });
    }
};
