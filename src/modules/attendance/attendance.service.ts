import moment from 'moment-timezone';
import { ApiError } from '../errors';
import httpStatus from 'http-status';
import { attendanceOfficeConfigService } from '../common/attendanceOfficeConfig';
import { officeServices } from '../office';
import mongoose from 'mongoose';
import { employeeService } from '../employee';
import Attendance from './attendance.model';
import { IAttendanceDoc } from './attendance.interface';
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
    attendanceStatus: todayAttendanceStatus ? 'CLOCKED_IN' : 'NOT_CLOCKED_IN',
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

export const getMyAttendance = async (employeeId: mongoose.Types.ObjectId) => {
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  const loadOfficeConfig = await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);
  if (!loadOfficeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  const officeWorkingDays = loadOfficeConfig.officeWorkingDays; // e.g., ["Monday", "Tuesday", ...]

  // Calculate the last 7 days, filtering out non-working days
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const day = moment().subtract(i, 'days');
    const dayName = day.format('dddd') as OfficeWorkingDaysEnum;

    // Only add if it's a working day
    if (officeWorkingDays.includes(dayName)) {
      last7Days.push(day.startOf('day').toDate());
    }
  }

  const pipeline = [
    {
      $match: {
        employeeId: employeeId,
        clockinTime: { $gte: last7Days[last7Days.length - 1] }, // Filter within the 7-day range
      },
    },
    {
      $project: {
        _id: 1,
        clockinTime: { $dateToString: { format: '%Y-%m-%d', date: '$clockinTime' } },
        clockoutTime: 1,
      },
    },
  ];

  const attendanceRecords = await Attendance.aggregate(pipeline);

  // Map attendance records to last 7 days, marking absent where no punch-in info exists
  const attendanceSummary = last7Days.map((date) => {
    const dateString = moment(date).format('YYYY-MM-DD');
    const record = attendanceRecords.find((rec) => rec.clockinTime === dateString);

    return {
      date: dateString,
      day: moment(date).format('dddd'),
      status: record ? 'Present' : 'Absent',
      clockinTime: record?.clockinTime || null,
      clockoutTime: record?.clockoutTime || null,
    };
  });

  return attendanceSummary;
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

export const clockinEmployee = async (employeeId: mongoose.Types.ObjectId, payload: any) => {
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
    officeId: employee.officeId,
    clockinTime: todayInOfficeTime.toISOString(),
    addedBy: employeeId,
  });

  return attendance;
};
