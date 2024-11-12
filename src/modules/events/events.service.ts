import mongoose, { PipelineStage } from 'mongoose';
import { EventType, IEventDoc, NewEvent } from './events.interfaces';
import Event from './events.model';

export const createEvent = async (
  userId: mongoose.Types.ObjectId,
  payload: NewEvent,
  type: EventType
): Promise<IEventDoc> => {
  return await Event.create({
    userId,
    type: type,
    ...payload,
  });
};

interface EventFilterOptions {
  userId: mongoose.Types.ObjectId; // optional, if you want to filter by specific user ID
  startDate?: Date; // start date for filtering (for day, week, or month views)
  endDate?: Date; // end date for filtering
}

export const getEventsByCalendarView = async (options: EventFilterOptions) => {
  const { startDate, endDate, userId } = options;

  // Set up a match filter to add to the pipeline based on provided options
  const matchFilter: any = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  // Convert date strings to Date objects if provided
  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : undefined;
  const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined;

  if (startDate && endDate) {
    matchFilter.date = {
      $gte: start,
      $lte: end,
    };
  } else if (startDate) {
    matchFilter.date = { $gte: start };
  } else if (endDate) {
    matchFilter.date = { $lte: end };
  }

  const pipeline: PipelineStage[] = [
    {
      $match: matchFilter,
    },
    {
      $sort: {
        date: 1,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'guests.userId',
        foreignField: '_id',
        as: 'guestDetails',
      },
    },
    {
      $unwind: { path: '$guestDetails', preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: {
        guestDetails: {
          $mergeObjects: [
            {
              _id: '$guestDetails._id',
              name: '$guestDetails.name',
              email: '$guestDetails.email',
            },
            {
              status: {
                $arrayElemAt: ['$guests.status', { $indexOfArray: ['$guests.userId', '$guestDetails._id'] }],
              },
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        user: { $first: '$user' },
        title: { $first: '$title' },
        description: { $first: '$description' },
        date: { $first: '$date' },
        startTime: { $first: '$startTime' },
        endTime: { $first: '$endTime' },
        timeZone: { $first: '$timeZone' },
        link: { $first: '$link' },
        location: { $first: '$location' },
        note: { $first: '$note' },
        guests: { $push: '$guestDetails' },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        date: 1,
        startTime: 1,
        endTime: 1,
        timeZone: 1,
        link: 1,
        location: 1,
        note: 1,
        guests: 1,
        'user.name': 1,
        'user.email': 1,
      },
    },
  ];

  const events = await Event.aggregate(pipeline);
  return events;
};
