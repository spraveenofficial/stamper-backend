import mongoose, { PipelineStage } from 'mongoose';
import { EventType, IEventDoc, NewEvent } from './events.interfaces';
import Event from './events.model';
import moment from 'moment';
import { Holiday } from '../common/officeHolidays';

/**
 *
 * @param {mongoose.Types.ObjectId} userId
 * @param {NewEvent} payload
 * @param {EventType} type
 * @returns {Promise<IEventDoc>}
 */

export const createEvent = async (
  userId: mongoose.Types.ObjectId,
  payload: NewEvent,
  type: EventType
): Promise<IEventDoc> => {
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
  return formattedEvent.length ? (formattedEvent[0] as IEventDoc) : (newEvent as IEventDoc);
};

interface EventFilterOptions {
  userId: mongoose.Types.ObjectId; // optional, if you want to filter by specific user ID
  startDate?: Date; // start date for filtering (for day, week, or month views)
  endDate?: Date; // end date for filtering
  orgId?: mongoose.Types.ObjectId; // optional, if you want to filter by organization ID
}

export const getCalendarViewData = async (options: EventFilterOptions) => {
  const { startDate, endDate, userId, orgId } = options;

  // Convert userId and orgId to ObjectId
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  // Date range conversion
  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : undefined;
  const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined;

  // Match filter for events
  const eventMatchFilter: any = {
    userId: userObjectId,
  };

  if (startDate && endDate) {
    eventMatchFilter.date = startDate === endDate ? { $gte: start, $lte: end } : { $gte: start, $lte: end };
  } else if (startDate) {
    eventMatchFilter.date = { $gte: start };
  } else if (endDate) {
    eventMatchFilter.date = { $lte: end };
  }

  // Event aggregation pipeline
  const eventPipeline: mongoose.PipelineStage[] = [
    { $match: eventMatchFilter },
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
        location: { $first: '$location' },
        guests: { $push: '$guests' },
      },
    },
    {
      $project: {
        id: '$_id',
        type: 1,
        title: 1,
        description: 1,
        date: 1,
        start: 1,
        end: 1,
        timeZone: 1,
        location: 1,
        guests: 1,
        'user.name': 1,
        'user.email': 1,
      },
    },
  ];

  // Match filter for holidays
  const holidayMatchFilter: any = {
    organizationId: orgObjectId,
  };

  if (startDate || endDate) {
    holidayMatchFilter['holidayList.date'] = {};
    if (startDate) {
      holidayMatchFilter['holidayList.date'].$gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      holidayMatchFilter['holidayList.date'].$lte = new Date(`${endDate}T23:59:59.999Z`);
    }
  }

  // Holiday aggregation pipeline
  const holidayPipeline: mongoose.PipelineStage[] = [
    { $match: holidayMatchFilter },
    { $unwind: '$holidayList' },
    {
      $match: {
        ...(startDate || endDate ? { 'holidayList.date': holidayMatchFilter['holidayList.date'] } : {}),
      },
    },
    {
      $addFields: {
        startDateTime: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M',
            date: {
              $dateFromParts: {
                year: { $year: '$holidayList.date' },
                month: { $month: '$holidayList.date' },
                day: { $dayOfMonth: '$holidayList.date' },
                hour: 0,
                minute: 0,
              },
            },
          },
        },
        endDateTime: {
          $dateToString: {
            format: '%Y-%m-%d %H:%M',
            date: {
              $dateFromParts: {
                year: { $year: '$holidayList.date' },
                month: { $month: '$holidayList.date' },
                day: { $dayOfMonth: '$holidayList.date' },
                hour: 23,
                minute: 59,
              },
            },
          },
        },
      },
    },
    {
      $project: {
        type: EventType.ONHOLIDAY,
        title: '$holidayList.description',
        description: '$holidayList.note',
        date: '$holidayList.date',
        start: '$startDateTime',
        end: '$endDateTime',
        timeZone: 'UTC',
        location: null,
        guests: [], // Ensuring it matches the empty array structure for guests in events
        user: {
          name: 'Organization', // Adjust as per your requirements, e.g., default user for holidays
          email: null,
        },
      },
    },
    { $sort: { date: 1 } },
  ];

  // Fetch events and holidays
  const [events, holidays] = await Promise.all([Event.aggregate(eventPipeline), Holiday.aggregate(holidayPipeline)]);

  // Combine results
  const combinedResults = [...events, ...holidays];

  // Sort by date
  combinedResults.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return combinedResults;
};
