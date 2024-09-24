import config from '../../config/config';
import { notificationConstants } from '.';
import { INotificationDoc, NotificationTypes } from './notification.interfaces';
import Notification from './notification.model';
import mongoose from 'mongoose';

export const createNotification = async (notification: any): Promise<INotificationDoc> => {
  return Notification.create(notification);
};

export const markNotoificationAsSeen = async (notificationId: string): Promise<INotificationDoc> => {
  return Notification.findByIdAndUpdate(notificationId, { seen: true }, { new: true }).select("-from -to");
};

export const getNotifications = async (userId: string): Promise<INotificationDoc[]> => {
  return Notification.find({ to: userId }).select("-from -to").sort({ createdAt: -1 });
};

export const deleteNotificationById = async (notificationId: string) => {
  return Notification.findByIdAndDelete(notificationId);
};

export const createLeaveRequestNotification = async (to: mongoose.Types.ObjectId, fromName: string, fromId: mongoose.Types.ObjectId, leaveId: mongoose.Types.ObjectId) => {
  const notification = {
    to: to,
    message: notificationConstants.notificationTemplates.LEAVE_REQUEST(fromName),
    type: NotificationTypes.LEAVE_REQUEST,
    url: `${config.clientUrl}/leave/${leaveId}`,
    from: fromId,
  };
  return createNotification(notification);
};

export const createLeaveApprovedNotification = async (to: mongoose.Types.ObjectId, fromName: string, fromId: mongoose.Types.ObjectId, leaveId: mongoose.Types.ObjectId) => {
  const notification = {
    to: to,
    message: notificationConstants.notificationTemplates.LEAVE_REQUEST_APPROVED(fromName),
    type: NotificationTypes.LEAVE_REQUEST_APPROVED,
    url: `${config.clientUrl}/leave/${leaveId}`,
    from: fromId,
  };
  return createNotification(notification);
};

export const markAllNotificationsAsSeen = async (userId: string) => {
  return Notification.updateMany({ to: userId }, { seen: true }, { multi: true });
};
