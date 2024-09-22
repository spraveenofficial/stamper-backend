import { INotificationDoc } from './notification.interfaces';
import Notification from './notification.model';

export const createNotification = async (notification: any) : Promise<INotificationDoc> => {
  return Notification.create(notification);
};

export const markNotoificationAsSeen = async (notificationId: string) : Promise<INotificationDoc | null> => {
  return Notification.findByIdAndUpdate(notificationId, { seen: true });
};

export const getNotifications = async (userId: string): Promise<INotificationDoc[]> => {
  return Notification.find({ to: userId }).sort({ createdAt: -1 });
};

export const deleteNotificationById = async (notificationId: string) => {
    return Notification.findByIdAndDelete(notificationId);
}