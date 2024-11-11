import mongoose from 'mongoose';
import { EventStatus, EventType, IEventDoc, IEventGuestsDoc, IEventGuestsModel, IEventModel } from './events.interfaces';
import { toJSON } from '../toJSON';

const { Schema } = mongoose;

const EventGuestsSchema = new Schema<IEventGuestsDoc, IEventGuestsModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: EventStatus,
    default: EventStatus.PENDING,
  },
});

const EventSchema = new Schema<IEventDoc, IEventModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: EventType,
      default: EventType.RESERVE,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    timeZone: {
      type: String,
      required: false,
      default: null,
    },
    link: {
      type: String,
      required: false,
      default: null,
    },
    location: {
      type: String,
      required: false,
      default: null,
    },
    guests: {
      type: [EventGuestsSchema],
      default: [],
    },
    note: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

EventSchema.plugin(toJSON);

const Event = mongoose.model<IEventDoc, IEventModel>('Event', EventSchema);

export default Event;
