import mongoose, { PipelineStage } from 'mongoose';
import { attendanceConfigInterface, AttendanceOfficeConfig } from '.';
import { Office } from '../../../modules/office';

export const findOfficeConfig = async (
  officeId: mongoose.Types.ObjectId
): Promise<attendanceConfigInterface.IAttendanceOfficeConfigDoc | null> => {
  const officeConfig = await AttendanceOfficeConfig.findOne({ officeId }).select('-__v').lean();
  return officeConfig;
};

export const createNewWorkSchedule = async (
  payload: attendanceConfigInterface.NewWorkSchedulePayload,
  orgId: mongoose.Types.ObjectId,
  addedBy: mongoose.Types.ObjectId
) => {
  if (await AttendanceOfficeConfig.isAlreadyExist(payload.officeId)) {
    throw new Error('Active Attendance office config already exists');
  }
  const workSchedule = await AttendanceOfficeConfig.create({ ...payload, organizationId: orgId, addedBy });
  return workSchedule;
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
  orgId: mongoose.Types.ObjectId,
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
              isActive: 1,
              officeLocationText: 1,
              selfieRequired: 1,
              effectiveFrom: 1,
              qrEnabled: 1,
              policyTitle: 1,
              clockinMode: 1,
            },
          },
        ],
        as: 'officeConfig',
      },
    },
    {
      $unwind: {
        path: '$officeConfig',
        preserveNullAndEmptyArrays: true,
      },
    },
    // {
    //   $addFields: {
    //     workingDaysActiveCount: {
    //       $cond: {
    //         if: {
    //           $gt: [
    //             {
    //               $size: {
    //                 $ifNull: [
    //                   {
    //                     $filter: {
    //                       input: '$officeConfig.workingDays',
    //                       as: 'day',
    //                       cond: { $eq: ['$$day.isActive', true] },
    //                     },
    //                   },
    //                   [],
    //                 ],
    //               },
    //             },
    //             0,
    //           ],
    //         },
    //         then: {
    //           $size: {
    //             $filter: {
    //               input: '$officeConfig.workingDays',
    //               as: 'day',
    //               cond: { $eq: ['$$day.isActive', true] },
    //             },
    //           },
    //         },
    //         else: null,
    //       },
    //     },
    //     workingDays: {
    //       $map: {
    //         input: '$officeConfig.workingDays',
    //         as: 'day',
    //         in: {
    //           day: '$$day.day',
    //           schedule: {
    //             isActive: '$$day.schedule.isActive',
    //             startTime: '$$day.schedule.startTime',
    //             endTime: '$$day.schedule.endTime',
    //             hours: '$$day.schedule.hours',
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
    {
      $project: {
        _id: 0,
        officeId: '$_id',
        officeName: '$officeDetails.name',
        officeTimeZone: '$officeDetails.timezone',
        policyId: '$officeConfig._id',
        isActive: '$officeConfig.isActive',
        policyTitle: '$officeConfig.policyTitle',
        clockinMode: '$officeConfig.clockinMode',
        geofencing: '$officeConfig.geofencing',
        radius: '$officeConfig.radius',
        qrEnabled: '$officeConfig.qrEnabled',
        selfieRequired: '$officeConfig.selfieRequired',
      },

    },
    {
      $facet: {
        metadata: [{ $count: 'totalCount' }, { $addFields: { page, limit } }],
        data: [{ $skip: skip }, { $limit: limit }],
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
  return response.length ? response[0] : { results: [], page: 1, limit, totalResults: 0, totalPages: 0 };
};

export const updateOfficeConfig = async (config: attendanceConfigInterface.UpdateAttendanceConfigPayload) => {
  const updatedConfig = await AttendanceOfficeConfig.findOneAndUpdate({ _id: config.id }, { $set: config }, { new: true });
  return updatedConfig;
};

export const getWorkScheduleConfigByOfficeId = async (officeId: mongoose.Types.ObjectId | string) => {
  // Ensure officeId is an ObjectId
  const Id = typeof officeId === 'string' ? new mongoose.Types.ObjectId(officeId) : officeId;

  // Write a pipeline to fetch the work schedule config by officeId in the attendance office config collection
  const pipeline: PipelineStage[] = [
    {
      $match: {
        officeId: Id,
      },
    },
    // Check if config is added by the user return all the details
    {
      $project: {
        _id: 0,
        policyId: '$_id',
        officeId: 1,
        scheduleType: 1,
        officeWorkingDays: 1,
        policyTitle: 1,
        workingDays: 1,
        isActive: 1,
        effectiveFrom: 1,
        standardHoursInADay: 1,
      },
    },
  ];

  // Execute the aggregation pipeline
  const response = await AttendanceOfficeConfig.aggregate(pipeline);
  return response;
};
