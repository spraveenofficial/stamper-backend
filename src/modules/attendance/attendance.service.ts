import moment from 'moment-timezone';
import { ApiError } from '../errors';
import httpStatus from 'http-status';
import { attendanceOfficeConfigService } from '../common/attendanceOfficeConfig';
import { officeServices } from '../office';
import mongoose from 'mongoose';
import { employeeService } from '../employee';
import Attendance from './attendance.model';
import { CreateClockinPayload, CreateClockoutPayload, IAttendanceDoc } from './attendance.interface';
import { OfficeWorkingDaysEnum } from '../common/attendanceOfficeConfig/attendanceOfficeConfig.interface';

export const checkIfEmployeeCanClockInToday = async (employeeId: mongoose.Types.ObjectId) => {
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  const loadOfficeConfig = await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);
  if (!loadOfficeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  const office = await officeServices.getOfficeById(employee.officeId);
  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office not found');
  }

  const [timezone, _offset] = office.timezone.split(' - ') ?? [null, null];
  const todayInOfficeTime = moment.tz(timezone!);
  const todayDayName = todayInOfficeTime.format('dddd') as OfficeWorkingDaysEnum;

  // Check if today is a working day in the office
  const isWorkingDay = loadOfficeConfig.officeWorkingDays.includes(todayDayName);

  // Check with the employee's working hours
  const currentHour = todayInOfficeTime.hour();
  const currentMinute = todayInOfficeTime.minute();
  const currentTime = `${currentHour}:${currentMinute}`;

  const officeStartTime = moment(loadOfficeConfig.officeStartTime, 'HH:mm');
  const officeEndTime = moment(loadOfficeConfig.officeEndTime, 'HH:mm');

  const lunchStartTime = moment(loadOfficeConfig.officeBreakStartTime, 'HH:mm');
  const lunchEndTime = moment(loadOfficeConfig.officeBreakEndTime, 'HH:mm');

  const isWithinWorkingHours = moment(currentTime, 'HH:mm').isBetween(officeStartTime, officeEndTime);

  // Fetch upcoming holidays
  // const upcomingHolidays = await holidayService.getUpcomingHolidays(employee.officeId);

  const todayAttendanceStatus = await getEmployeeTodayAttendanceBasedOnUTC(employeeId, todayInOfficeTime.toISOString());
  const response = {
    isWorkingDay,
    isWithinWorkingHours,
    attendanceStatus: todayAttendanceStatus?.isClockedin
      ? 'CLOCKED_IN'
      : todayAttendanceStatus
      ? 'CLOCKED_OUT'
      : 'NOT_CLOCKED_IN',
    clockedInAt: todayAttendanceStatus ? todayAttendanceStatus.clockinTime : null,
    eligibleForLunch: isWorkingDay ? moment(currentTime, 'HH:mm').isBetween(lunchStartTime, lunchEndTime) : false,
    officeStartTime: officeStartTime.format('HH:mm'),
    officeEndTime: officeEndTime.format('HH:mm'),
    upcomingHolidays: [],
    geofencingEnabled: loadOfficeConfig.geofencing,
    officeLocation: loadOfficeConfig.geofencing
      ? {
          latitude: loadOfficeConfig.officeLocation.coordinates[1],
          longitude: loadOfficeConfig.officeLocation.coordinates[0],
          radius: loadOfficeConfig.radius,
        }
      : null,
    officeLocationText: loadOfficeConfig.officeLocationText,
    lunchInfo: {
      startTime: loadOfficeConfig.officeBreakStartTime,
      endTime: loadOfficeConfig.officeBreakEndTime,
      duration: loadOfficeConfig.officeBreakDurationInMinutes,
    },
    officeUTCConfig: {
      timezone,
      _offset,
    },
  };

  return response;
};

export const getMyAttendance = async (
  employeeId: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10,
  status?: 'present' | 'absent' | 'all',
  startDate?: string,
  endDate?: string
) => {
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  const loadOfficeConfig = await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);
  if (!loadOfficeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  const officeWorkingDays = loadOfficeConfig.officeWorkingDays;
  const skip = (page - 1) * limit;

  // Determine the date range
  const endMoment = endDate ? moment(endDate) : moment();
  const startMoment = startDate ? moment(startDate) : endMoment.clone().subtract(6, 'days');

  // Generate the days in the date range, filtering out non-working days
  const dateRange = [];
  let currentDate = endMoment;
  while (currentDate.isSameOrAfter(startMoment, 'day')) {
    const dayName = currentDate.format('dddd') as OfficeWorkingDaysEnum;
    if (officeWorkingDays.includes(dayName)) {
      dateRange.push(currentDate.startOf('day').toDate());
    }
    currentDate = currentDate.subtract(1, 'days');
  }

  const pipeline = [
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId),
        clockinTime: { $gte: dateRange[dateRange.length - 1], $lte: dateRange[0] }, // Use selected date range
      },
    },
    {
      $project: {
        _id: 1,
        clockinTime: 1,
        clockoutTime: 1,
        clockinIpAddress: 1,
        clockoutIpAddress: 1,
        clockinDevice: 1,
        clockoutDevice: 1,
        clockinBrowser: 1,
        clockoutBrowser: 1,
        clockinOs: 1,
        clockoutOs: 1,
        totalLoggedHours: 1,
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

  const [attendanceData] = await Attendance.aggregate(pipeline);

  // Map attendance records to date range and apply status filter
  const attendanceSummary = dateRange.map((date) => {
    const record = attendanceData.results.find((rec: any) => moment(rec.clockinTime).isSame(date, 'day'));

    const attendanceStatus = record ? 'Present' : 'Absent';

    return {
      date: moment(date).format('YYYY-MM-DD').toString(),
      day: moment(date).format('dddd'),
      status: attendanceStatus,
      clockinTime: record?.clockinTime || null,
      clockoutTime: record?.clockoutTime || null,
      clockinIpAddress: record?.clockinIpAddress || null,
      clockoutIpAddress: record?.clockoutIpAddress || null,
      clockinDevice: record?.clockinDevice || null,
      clockoutDevice: record?.clockoutDevice || null,
      clockinBrowser: record?.clockinBrowser || null,
      clockoutBrowser: record?.clockoutBrowser || null,
      clockinOs: record?.clockinOs || null,
      clockoutOs: record?.clockoutOs || null,
      totalLoggedHours: record?.totalLoggedHours || null,
    };
  });

  // Apply status filter (if provided)
  const filteredSummary =
    status !== 'all' ? attendanceSummary.filter((entry) => entry.status.toLowerCase() === status) : attendanceSummary;

  return {
    results: filteredSummary.slice(skip, skip + limit),
    page,
    limit,
    totalResults: filteredSummary.length,
    totalPages: Math.ceil(filteredSummary.length / limit),
  };
};

export const getEmployeeTodayAttendanceBasedOnUTC = async (
  employeeId: mongoose.Types.ObjectId,
  utc: string
): Promise<IAttendanceDoc | null> => {
  const attendance = await Attendance.findOne({
    employeeId,
    clockinTime: {
      $gte: moment(utc).startOf('day').toDate(),
      $lte: moment(utc).endOf('day').toDate(),
    },
  });

  return attendance;
};

export const clockinEmployee = async (employeeId: mongoose.Types.ObjectId, payload: CreateClockinPayload) => {
  if (await Attendance.isAttendanceAlreadyMarkedToday(employeeId, payload.officeId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attendance already marked for today');
  }

  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  const loadOfficeConfig = await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);

  if (!loadOfficeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  const office = await officeServices.getOfficeById(employee.officeId);

  const [timezone, _offset] = office?.timezone.split(' - ') ?? [null, null];

  const todayInOfficeTime = moment.tz(timezone!);

  const todayDayName = todayInOfficeTime.format('dddd') as OfficeWorkingDaysEnum;

  const isWorkingDay = loadOfficeConfig.officeWorkingDays.includes(todayDayName);

  const currentHour = todayInOfficeTime.hour();

  const currentMinute = todayInOfficeTime.minute();

  const currentTime = `${currentHour}:${currentMinute}`;

  const officeStartTime = moment(loadOfficeConfig.officeStartTime, 'HH:mm');

  const officeEndTime = moment(loadOfficeConfig.officeEndTime, 'HH:mm');

  const isWithinWorkingHours = moment(currentTime, 'HH:mm').isBetween(officeStartTime, officeEndTime);

  const lunchStartTime = moment(loadOfficeConfig.officeBreakStartTime, 'HH:mm');

  const lunchEndTime = moment(loadOfficeConfig.officeBreakEndTime, 'HH:mm');

  const isWithinLunchHours = moment(currentTime, 'HH:mm').isBetween(lunchStartTime, lunchEndTime);

  if (!isWorkingDay) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Today is not a working day');
  }

  if (!isWithinWorkingHours) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot clock in outside working hours');
  }

  if (isWithinLunchHours) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot clock in during lunch hours');
  }

  const attendance = await Attendance.create({
    employeeId,
    ...payload,
    isClockedin: true,
  });

  return attendance;
};

export const clockoutEmployee = async (employeeId: mongoose.Types.ObjectId, payload: CreateClockoutPayload) => {
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  const loadOfficeConfig = await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);

  if (!loadOfficeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  const office = await officeServices.getOfficeById(employee.officeId);

  const [timezone, _offset] = office?.timezone.split(' - ') ?? [null, null];

  const todayInOfficeTime = moment.tz(timezone!);

  const todayDayName = todayInOfficeTime.format('dddd') as OfficeWorkingDaysEnum;

  const isWorkingDay = loadOfficeConfig.officeWorkingDays.includes(todayDayName);

  // const currentHour = todayInOfficeTime.hour();

  // const currentMinute = todayInOfficeTime.minute();

  // const currentTime = `${currentHour}:${currentMinute}`;

  if (!isWorkingDay) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Today is not a working day');
  }

  const attendance = await Attendance.findOneAndUpdate(
    {
      employeeId,
      isClockedin: true,
    },
    {
      ...payload,
      isClockedout: true,
      isClockedin: false,
      clockoutTime: todayInOfficeTime.toDate(),
    },
    { new: true }
  );

  return attendance;
};
