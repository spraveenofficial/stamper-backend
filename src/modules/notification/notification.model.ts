import mongoose, { Schema } from 'mongoose';
import { INotification, INotificationModel } from './notification.interfaces';
import { toJSON } from '../toJSON';

const NotificationSchema = new Schema<INotification, INotificationModel>(
  {
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.plugin(toJSON);

const Notification = mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);

export default Notification;