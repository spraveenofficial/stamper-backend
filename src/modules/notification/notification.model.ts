import mongoose, { Schema } from 'mongoose';
import { INotificationDoc, INotificationModel, NotificationTypes } from './notification.interfaces';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';

const NotificationSchema = new Schema<INotificationDoc, INotificationModel>(
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
      enum: NotificationTypes,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.plugin(toJSON);
NotificationSchema.plugin(paginate);

const Notification = mongoose.model<INotificationDoc, INotificationModel>('Notification', NotificationSchema);

export default Notification;
