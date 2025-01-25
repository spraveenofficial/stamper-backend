import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { ApiError } from '../../../modules/errors';
import { Office } from '../../../modules/office';
import Holiday from './holiday.model';
import { HolidayListType, IHolidayDoc, NewHolidayPayloadType, UpdateHolidayPayloadType } from './holidays.interfaces';

export const addHoliday = async (
  userId: mongoose.Types.ObjectId,
  orgId: mongoose.Types.ObjectId,
  payload: NewHolidayPayloadType
): Promise<IHolidayDoc> => {
  if (await Holiday.isHolidayExistForFinancialYear(new mongoose.Types.ObjectId(payload.officeId), +payload.financialYear)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Holiday already exists for this financial year');
  }
  const holiday = await Holiday.create({
    ...payload,
    organizationId: orgId,
    addedBy: userId,
  });

  return holiday;
};

export const getHolidaysForOffices = async (
  organizationId: mongoose.Types.ObjectId,
  officeId?: mongoose.Types.ObjectId,
  year?: number
): Promise<any> => {
  const filter: any = { organizationId: new mongoose.Types.ObjectId(organizationId) };

  if (officeId) {
    filter._id = new mongoose.Types.ObjectId(officeId);
  }

  // Use provided year or fallback to current year
  const targetYear = year || new Date().getFullYear();

  const pipeline = [
    {
      $match: filter,
    },
    {
      $project: {
        _id: 1,
        name: 1,
        isHeadQuarter: 1,
        isOperational: 1,
      },
    },
    {
      $lookup: {
        from: 'holidays',
        let: { officeId: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$officeId', '$$officeId'] }, { $eq: ['$financialYear', targetYear] }] } } }, // Filter holidays by financialYear
          {
            $project: {
              holidayList: {
                $map: {
                  input: '$holidayList',
                  as: 'holiday',
                  in: {
                    holidayId: '$$holiday._id', // Rename _id to holidayId
                    description: '$$holiday.description',
                    date: '$$holiday.date',
                    note: '$$holiday.note',
                  },
                },
              },
              financialYear: 1,
            },
          },
        ],
        as: 'holidaysData',
      },
    },
    {
      $addFields: {
        officeId: '$_id', // Add officeId field
        holidayListId: { $ifNull: [{ $arrayElemAt: ['$holidaysData._id', 0] }, null] }, // Set holidayListId or null
        financialYear: { $ifNull: [{ $arrayElemAt: ['$holidaysData.financialYear', 0] }, targetYear] }, // Set financial year for office
        holidayList: { $ifNull: [{ $arrayElemAt: ['$holidaysData.holidayList', 0] }, []] }, // Set holiday list or empty array
      },
    },
    {
      $project: {
        holidaysData: 0, // Exclude the intermediate holidaysData field from final output
        _id: 0,
      },
    },
  ];

  const response = await Office.aggregate(pipeline);

  return response.length ? response[0] : null;
};

export const editHoliday = async (holidayId: string, payload: UpdateHolidayPayloadType): Promise<IHolidayDoc> => {
  const holiday = await Holiday.findById(new mongoose.Types.ObjectId(holidayId));
  if (!holiday) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Holiday not found');
  }

  // Check if payload.holidayList items are unique
  const dates = new Set<string>();
  for (const item of payload.holidayList) {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (dates.has(date!)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Holiday dates should be unique');
    }
    dates.add(date!);
  }

  // Extract current holiday dates from the database
  const existingDates = new Set(holiday.holidayList.map((item) => new Date(item.date).toISOString().split('T')[0]));

  // Find dates to be removed
  const updatedDates = new Set(payload.holidayList.map((item) => new Date(item.date).toISOString().split('T')[0]));
  const datesToRemove = [...existingDates].filter((date) => !updatedDates.has(date));

  // Remove holidays from the database that are no longer in the list
  holiday.holidayList = holiday.holidayList.filter(
    (item) => !datesToRemove.includes(new Date(item.date).toISOString().split('T')[0])
  );

  // Add or update holidays in the list
  for (const newItem of payload.holidayList) {
    const existingHoliday = holiday.holidayList.find(
      (item) => new Date(item.date).toISOString().split('T')[0] === new Date(newItem.date).toISOString().split('T')[0]
    );

    if (existingHoliday) {
      // Update existing holiday
      existingHoliday.description = newItem.description;
      existingHoliday.note = newItem.note;
    } else {
      // Add new holiday
      holiday.holidayList.push(newItem);
    }
  }

  // Save the updated document
  await holiday.save();
  return holiday;
};

export const getNextTenHolidaysForOffice = async (officeId: mongoose.Types.ObjectId): Promise<HolidayListType[]> => {
  const holidays = await Holiday.aggregate([
    // Step 1: Filter documents by officeId
    { $match: { officeId: new mongoose.Types.ObjectId(officeId), financialYear: new Date().getFullYear() } },
    // Step 2: Unwind the holidayList array
    { $unwind: '$holidayList' },
    // Step 3: Filter for upcoming holidays only
    {
      $match: {
        $expr: {
          $gte: [
            {
              $dateFromParts: {
                year: { $year: '$holidayList.date' },
                month: { $month: '$holidayList.date' },
                day: { $dayOfMonth: '$holidayList.date' },
              },
            },
            {
              $dateFromParts: {
                year: { $year: new Date() },
                month: { $month: new Date() },
                day: { $dayOfMonth: new Date() },
              },
            },
          ],
        },
      },
    },
    // Step 4: Sort by holiday date in ascending order
    { $sort: { 'holidayList.date': 1 } },
    // Step 5: Limit to the next 10 holidays
    { $limit: 10 },
    // Step 6: Project only necessary fields
    {
      $project: {
        _id: 0, // Exclude the document _id from output
        description: '$holidayList.description',
        date: '$holidayList.date',
        note: '$holidayList.note',
      },
    },
  ]);

  // Return holidays array, or an empty array if no results
  return holidays.length ? holidays : [];
};
