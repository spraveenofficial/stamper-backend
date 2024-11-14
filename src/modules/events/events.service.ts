import mongoose, { PipelineStage } from 'mongoose';
import { EventType, IEventDoc, NewEvent } from './events.interfaces';
import Event from './events.model';
import moment from 'moment';

/**
 *
 * @param {mongoose.Types.ObjectId} userId
 * @param {NewEvent} payload
 * @param {EventType} type
 * @returns {Promise<IEventDoc>}
 */

export const createEvent = async (userId: mongoose.Types.ObjectId, payload: NewEvent, type: EventType): Promise<IEventDoc> => {
  const { date, ...restPayload } = payload;

  // Create the event and capture the new event document
  const newEvent = await Event.create({
    userId,
    type,
    date: moment(date).toDate(),
    ...restPayload,
  });

  // Use the event's _id to match and format it with the aggregation pipeline
  const pipeline: PipelineStage[] = [
    { $match: { _id: newEvent._id } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'guests.userId', foreignField: '_id', as: 'guestDetails' } },
    { $unwind: { path: '$guestDetails', preserveNullAndEmptyArrays: true } },
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
        startDateTime: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M',
            date: {
              $dateFromParts: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' },
                hour: { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] } },
                minute: { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 1] } },
              },
            },
          },
        },
        endDateTime: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M',
            date: {
              $dateFromParts: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' },
                hour: { $toInt: { $arrayElemAt: [{ $split: ['$endTime', ':'] }, 0] } },
                minute: { $toInt: { $arrayElemAt: [{ $split: ['$endTime', ':'] }, 1] } },
              },
            },
          },
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
        start: { $first: '$startDateTime' },
        end: { $first: '$endDateTime' },
        timeZone: { $first: '$timeZone' },
        link: { $first: '$link' },
        location: { $first: '$location' },
        note: { $first: '$note' },
        guests: { $push: '$guestDetails' },
      },
    },
    {
      $addFields: {
        guests: {
          $cond: {
            if: { $eq: ['$guests', [{}]] },
            then: [],
            else: '$guests',
          },
        },
      },
    },
    {
      $project: {
        id: '$_id',
        _id: 0,
        title: 1,
        description: 1,
        date: 1,
        start: 1,
        end: 1,
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

  // Run the aggregation pipeline to format the event data
  const formattedEvent = await Event.aggregate(pipeline);

  // Return the formatted event if found, or the created event as fallback
  return formattedEvent.length ? formattedEvent[0] as IEventDoc : newEvent as IEventDoc;
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
    // When startDate and endDate are identical, handle it as a single-day range
    matchFilter.date = startDate === endDate ? { $gte: start, $lte: end } : { $gte: start, $lte: end };
  } else if (startDate) {
    matchFilter.date = { $gte: start };
  } else if (endDate) {
    matchFilter.date = { $lte: end };
  }

  const pipeline: PipelineStage[] = [
    { $match: matchFilter },
    { $sort: { date: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'guests.userId',
        foreignField: '_id',
        as: 'guestDetails',
      },
    },
    { $unwind: { path: '$guestDetails', preserveNullAndEmptyArrays: true } },
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
      $addFields: {
        startDateTime: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M',
            date: {
              $dateFromParts: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' },
                hour: { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] } },
                minute: { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 1] } },
              },
            },
          },
        },
        endDateTime: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M',
            date: {
              $dateFromParts: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' },
                hour: { $toInt: { $arrayElemAt: [{ $split: ['$endTime', ':'] }, 0] } },
                minute: { $toInt: { $arrayElemAt: [{ $split: ['$endTime', ':'] }, 1] } },
              },
            },
          },
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
        start: { $first: '$startDateTime' },
        end: { $first: '$endDateTime' },
        timeZone: { $first: '$timeZone' },
        link: { $first: '$link' },
        location: { $first: '$location' },
        note: { $first: '$note' },
        guests: { $push: '$guestDetails' },
      },
    },
    {
      $addFields: {
        guests: {
          $cond: {
            if: { $eq: ['$guests', [{}]] }, // Check if guests array is empty or contains empty object
            then: [],
            else: '$guests',
          },
        },
      },
    },
    {
      $project: {
        id: '$_id', // Rename _id to id
        _id: 0, // Exclude _id field
        title: 1,
        description: 1,
        date: 1,
        start: 1,
        end: 1,
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
