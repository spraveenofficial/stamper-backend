import mongoose from 'mongoose';
import { EventType, IEventDoc, NewEvent } from './events.interfaces';
import Event from './events.model';

export const createEvent = async (
  userId: mongoose.Types.ObjectId,
  payload: NewEvent,
  type: EventType,
): Promise<IEventDoc> => {
  return await Event.create({
    userId,
    type: type,
    ...payload,
  });
};
