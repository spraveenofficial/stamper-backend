import mongoose from 'mongoose';
import { attendanceConfigInterface, AttendanceOfficeConfig } from '.';
import { Office } from '../../../modules/office';
import { IAttendanceOfficeConfig } from './attendanceOfficeConfig.interface';

export const saveOfficeConfig = async (
  config: attendanceConfigInterface.NewAttendanceConfigPayload,
  orgId: mongoose.Types.ObjectId,
  addedBy: mongoose.Types.ObjectId
) => {
  if (await AttendanceOfficeConfig.isAlreadyExist(config.officeId)) {
    throw new Error('Active Attendance office config already exists');
  }
  const officeConfig = await AttendanceOfficeConfig.create({ organizationId: orgId, ...config, addedBy: addedBy });
  return officeConfig;
};

export const findOfficeConfig = async (officeId: mongoose.Types.ObjectId) :Promise<IAttendanceOfficeConfig | null> => {
  const officeConfig = await AttendanceOfficeConfig.findOne({ officeId });
  return officeConfig;
};

export const isUserIsWithinGeofence = async (userLongitude: number, userLatitude: number) => {
  // Fetch geofence with center and radius info
  const geofence = await AttendanceOfficeConfig.findOne({
    isActive: true,
  });

  if (!geofence || !geofence.radius) {
    return false; // Return false if no geofence or radius is found
  }

  // Convert the radius from meters to radians by dividing by Earth's radius in meters
  const radiusInRadians = geofence.radius / 6378100;

  // Check if user's location falls within the geofence radius
  const isWithin = await AttendanceOfficeConfig.findOne({
    center: {
      $geoWithin: {
        $centerSphere: [[userLongitude, userLatitude], radiusInRadians],
      },
    },
    isActive: true,
  });

  return isWithin ? true : false;
};

export const getOrganizationOfficeConfig = async (
  orgId: string,
  officeId?: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  const filter: any = { organizationId: new mongoose.Types.ObjectId(orgId) };

  if (officeId) {
    filter._id = new mongoose.Types.ObjectId(officeId);
  }

  const pipeline = [
    {
      $match: filter,
    },
    {
      $lookup: {
        from: 'offices',
        localField: '_id',
        foreignField: '_id',
        as: 'officeDetails',
      },
    },
    {
      $unwind: {
        path: '$officeDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'attendanceofficeconfigs',
        let: { officeId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$officeId', '$$officeId'] } } },
          {
            $project: {
              _id: 1,
              officeLocation: 1,
              geofencing: 1,
              radius: 1,
              officeLocationText: 1,
              officeStartTime: 1,
              officeEndTime: 1,
              officeBreakStartTime: 1,
              officeBreakEndTime: 1,
              officeBreakDurationInMinutes: 1,
              officeWorkingDays: 1,
              officeTimezone: 1,
            },
          },
        ],
        as: 'officeConfig',
      },
    },
    {
      $addFields: {
        isAttendanceConfigAdded: { $gt: [{ $size: '$officeConfig' }, 0] },
      },
    },
    {
      $unwind: {
        path: '$officeConfig',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        workingDaysCount: {
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ['$officeConfig.officeWorkingDays', []] } }, 0] },
            then: { $size: '$officeConfig.officeWorkingDays' },
            else: null,
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        officeId: '$_id',
        officeName: '$officeDetails.name',
        officeTimeZone: '$officeDetails.timezone',
        isAttendanceConfigAdded: 1,
        policyId: '$officeConfig._id',
        officeLocation: '$officeConfig.officeLocation',
        geofencing: '$officeConfig.geofencing',
        radius: '$officeConfig.radius',
        officeLocationText: '$officeConfig.officeLocationText',
        officeStartTime: '$officeConfig.officeStartTime',
        officeEndTime: '$officeConfig.officeEndTime',
        officeBreakStartTime: '$officeConfig.officeBreakStartTime',
        officeBreakEndTime: '$officeConfig.officeBreakEndTime',
        officeBreakDurationInMinutes: '$officeConfig.officeBreakDurationInMinutes',
        officeWorkingDays: '$officeConfig.officeWorkingDays',
        officeTimezone: '$officeConfig.officeTimezone',
        workingDaysCount: 1,
      },
    },
    {
      $facet: {
        metadata: [
          { $count: 'totalCount' },
          { $addFields: { page, limit } },
        ],
        data: [
          { $skip: skip },
          { $limit: limit },
        ],
      },
    },
    {
      $unwind: '$metadata',
    },
    {
      $project: {
        results: '$data',
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalResults: '$metadata.totalCount',
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', '$metadata.limit'] },
        },
      },
    },
  ];

  const response = await Office.aggregate(pipeline);
  return response.length
    ? response[0]
    : { results: [], page: 1, limit, totalResults: 0, totalPages: 0 };
};
