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
import { attendanceUtils } from '.';
import { officeHolidayServices } from '../common/officeHolidays';
import { leaveService } from '../leave';

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
  let isOnLeave = false;
  if (isWorkingDay) {
    // Check if employee is on leave today
    isOnLeave = await leaveService.isEmployeeIsOnLeave(
      employeeId,
      todayInOfficeTime.toISOString() as unknown as Date,
      todayInOfficeTime.toISOString() as unknown as Date
    );
  }

  // Parse office working hours and break times with timezone
  const officeStartTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeStartTime, timezone!);
  const officeEndTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeEndTime, timezone!);
  const lunchStartTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeBreakStartTime, timezone!);
  const lunchEndTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeBreakEndTime, timezone!);

  const isWithinWorkingHours = todayInOfficeTime.isBetween(officeStartTime, officeEndTime);
  const eligibleForLunch = isWorkingDay && todayInOfficeTime.isBetween(lunchStartTime, lunchEndTime);

  // Get today's attendance status
  const todayAttendanceStatus = await getEmployeeTodayAttendanceBasedOnUTC(employeeId, todayInOfficeTime.toISOString());

  const holidays = await officeHolidayServices.getNextTenHolidaysForOffice(employee.officeId);
  const response = {
    isWorkingDay: isWorkingDay && !isOnLeave,
    isWithinWorkingHours,
    attendanceStatus: todayAttendanceStatus?.isClockedin
      ? 'CLOCKED_IN'
      : todayAttendanceStatus
      ? 'CLOCKED_OUT'
      : 'NOT_CLOCKED_IN',
    clockedInAt: todayAttendanceStatus
      ? attendanceUtils.parseOfficeTimes(todayAttendanceStatus.clockinTime as unknown as string, timezone!)
      : null,
    eligibleForLunch,
    officeStartTime: loadOfficeConfig.officeStartTime,
    officeEndTime: loadOfficeConfig.officeEndTime,
    upcomingHolidays: holidays, // Placeholder if upcoming holidays are needed
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
  status?: 'present' | 'absent' | 'all'
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

  // Define the start of the month and the end date (today or the end of the month if in the past)
  const currentMoment = moment();
  const startOfMonth = currentMoment.clone().startOf('month');
  const endOfMonth = currentMoment.clone().endOf('month').isAfter(moment())
    ? currentMoment
    : currentMoment.clone().endOf('month');

  // Ensure the date range starts from the employee's joining date or later
  const startDate = moment(employee.joiningDate).isAfter(startOfMonth) ? moment(employee.joiningDate) : startOfMonth;

  // Generate the days in the date range, filtering out non-working days
  const dateRange = [];
  let currentDate = endOfMonth;
  while (currentDate.isSameOrAfter(startDate, 'day')) {
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
      $unwind: { path: '$metadata', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        results: '$data',
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalResults: { $ifNull: ['$metadata.totalCount', 0] },
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', '$metadata.limit'] },
        },
      },
    },
  ];

  const [attendanceData] = await Attendance.aggregate(pipeline);

  const attendanceResults = attendanceData?.results || [];

  // Map attendance records to date range and apply status filter
  const attendanceSummary = dateRange.map((date) => {
    const record = attendanceResults.find((rec: any) => moment.tz(rec.clockinTime, 'UTC').isSame(date, 'day'));

    const attendanceStatus = record ? 'Present' : 'Absent';

    return {
      date: moment.tz(date, 'UTC').format('YYYY-MM-DD'),
      day: moment.tz(date, 'UTC').format('dddd') as OfficeWorkingDaysEnum,
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
    status && status !== 'all' ? attendanceSummary.filter((rec) => rec.status.toLowerCase() === status) : attendanceSummary;

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

  const [timezone] = office?.timezone.split(' - ') ?? [];
  if (!timezone) throw new ApiError(httpStatus.BAD_REQUEST, 'Office timezone not found');

  const todayInOfficeTime = moment.tz(timezone!);

  const todayDayName = todayInOfficeTime.format('dddd') as OfficeWorkingDaysEnum;

  const isWorkingDay = attendanceUtils.checkWorkingDay(loadOfficeConfig.officeWorkingDays, todayDayName);

  if (!isWorkingDay) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Today is not a working day');
  }

  const currentTime = todayInOfficeTime.clone().set({
    hour: todayInOfficeTime.hour(),
    minute: todayInOfficeTime.minute(),
  });

  const officeStartTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeStartTime, timezone!);

  const officeEndTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeEndTime, timezone!);

  const isWithinWorkingHours = moment(currentTime, 'HH:mm').isBetween(officeStartTime, officeEndTime);

  const lunchStartTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeBreakStartTime, timezone!);

  const lunchEndTime = attendanceUtils.parseOfficeTimes(loadOfficeConfig.officeBreakEndTime, timezone!);

  const isWithinLunchHours = moment(currentTime, 'HH:mm').isBetween(lunchStartTime, lunchEndTime);

  if (!isWithinWorkingHours) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot clock in outside working hours');
  }

  if (isWithinLunchHours) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot clock in during lunch hours');
  }
  const attendance = await Attendance.create({
    employeeId,
    ...payload,
    clockinTime: attendanceUtils.parseOfficeTimes(payload.clockinTime as unknown as string, timezone!).toDate(),
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

  const todayInOfficeTime = attendanceUtils.parseOfficeTimes(payload.clockoutTime as unknown as string, timezone!);

  const todayDayName = todayInOfficeTime.format('dddd') as OfficeWorkingDaysEnum;

  const isWorkingDay = loadOfficeConfig.officeWorkingDays.includes(todayDayName);

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

export const getEmployeeMonthlySummary = async (employeeId: mongoose.Types.ObjectId): Promise<any> => {
  // Retrieve the employee's details
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  // Retrieve the office configuration for the employee's office
  const officeConfig = await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);
  if (!officeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  // Get the current date, year, and month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Calculate the start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Get attendance records for the employee within the month
  const attendanceRecords = await getEmployeeAttendanceRecords(employeeId, startDate, endDate);

  // Calculate daily working hours based on office start and end times
  const dailyWorkingHours = moment(officeConfig.officeEndTime, 'HH:mm').diff(
    moment(officeConfig.officeStartTime, 'HH:mm'),
    'hours',
    true
  );

  // Calculate weekly working hours based on configured working days
  const weeklyWorkingHours = dailyWorkingHours * officeConfig.officeWorkingDays.length;

  // Calculate monthly working hours based on weekly working hours
  const totalWeeksInMonth = Math.ceil(endDate.getDate() / 7);
  const monthlyWorkingHours = weeklyWorkingHours * totalWeeksInMonth;

  // Initialize summary variables
  let totalLoggedHours = 0;
  let totalOvertime = 0;
  let totalPaidTimeOff = 0; // Placeholder for PTO calculation

  // Process each attendance record
  attendanceRecords.forEach((record: IAttendanceDoc) => {
    const loggedHours = record.totalLoggedHours || 0;
    totalLoggedHours += loggedHours;

    // Calculate overtime if logged hours exceed daily working hours
    if (loggedHours > dailyWorkingHours) {
      totalOvertime += loggedHours - dailyWorkingHours;
    }
  });

  // Return the monthly summary
  return {
    year,
    month,
    weeklyWorkingHours: +weeklyWorkingHours.toFixed(2),
    monthlyWorkingHours: +monthlyWorkingHours.toFixed(2),
    totalLoggedHours: +totalLoggedHours.toFixed(2),
    totalOvertimeHours: +totalOvertime.toFixed(2),
    totalPaidTimeOff,
  };
};

export const getEmployeeAttendanceRecords = async (
  employeeId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
): Promise<IAttendanceDoc[]> => {
  const attendanceRecords = await Attendance.find({
    employeeId,
    clockinTime: { $gte: startDate, $lte: endDate },
    isClockedout: true,
  });

  return attendanceRecords;
};
