import httpStatus from 'http-status';
import moment from 'moment-timezone';
import mongoose from 'mongoose';
import { attendanceUtils } from '.';
import { attendanceConfigInterface, attendanceOfficeConfigService } from '../common/attendanceOfficeConfig';
import { IAttendanceOfficeConfigDoc, OfficeScheduleTypeEnum, OfficeWorkingDaysEnum } from '../common/attendanceOfficeConfig/attendanceOfficeConfig.interface';
import { officeHolidayServices } from '../common/officeHolidays';
import { employeeService } from '../employee';
import { ApiError } from '../errors';
import { leaveService } from '../leave';
import { officeServices } from '../office';
import { CreateClockinPayload, CreateClockoutPayload, IAttendanceDoc } from './attendance.interface';
import Attendance from './attendance.model';
import { checkWorkingDay } from './attendance.utils';

export const checkIfEmployeeCanClockInToday = async (employeeId: mongoose.Types.ObjectId) => {
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  const loadOfficeConfig: attendanceConfigInterface.IAttendanceOfficeConfigDoc | null = await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);
  if (!loadOfficeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  const office = await officeServices.getOfficeById(employee.officeId);
  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office not found');
  }

  const [timezone, _offset] = office.timezone.split(' - ') ?? [null, null];
  const todayInOfficeTime = moment.tz(timezone!);
  const todayDayName = todayInOfficeTime.format('dddd') as attendanceConfigInterface.OfficeWorkingDaysEnum;

  // Check if today is a working day in the office
  const todayWorkingDayConfig = loadOfficeConfig.workingDays.find((day) => day.day === todayDayName);
  const isWorkingDay = checkWorkingDay(loadOfficeConfig.workingDays.map((day) => day.day), todayDayName);

  let isOnLeave = false;
  if (isWorkingDay) {
    // Check if employee is on leave today
    isOnLeave = await leaveService.isEmployeeIsOnLeave(
      employeeId,
      todayInOfficeTime.toISOString() as unknown as Date,
      todayInOfficeTime.toISOString() as unknown as Date
    );
  }

  // Parse office working hours
  let officeStartTime = null;
  let officeEndTime = null;
  if (loadOfficeConfig.scheduleType === attendanceConfigInterface.OfficeScheduleTypeEnum.CLOCK && isWorkingDay) {
    officeStartTime = attendanceUtils.parseOfficeTimes(todayWorkingDayConfig?.schedule?.startTime!, timezone!);
    officeEndTime = attendanceUtils.parseOfficeTimes(todayWorkingDayConfig?.schedule?.endTime!, timezone!);
  }

  // Parse lunch break times (if defined)

  const isWithinWorkingHours =
    officeStartTime && officeEndTime && todayInOfficeTime.isBetween(officeStartTime, officeEndTime);

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
    officeStartTime: officeStartTime?.format('HH:mm') ?? null,
    officeEndTime: officeEndTime?.format('HH:mm') ?? null,
    upcomingHolidays: holidays,
    geofencingEnabled: loadOfficeConfig.geofencing,
    officeLocation: loadOfficeConfig.geofencing
      ? {
        latitude: loadOfficeConfig.officeLocation.coordinates[1],
        longitude: loadOfficeConfig.officeLocation.coordinates[0],
        radius: loadOfficeConfig.radius,
      }
      : null,
    officeLocationText: loadOfficeConfig.officeLocationText,
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

  const officeWorkingDays = loadOfficeConfig.workingDays.map((day) => day.day) as OfficeWorkingDaysEnum[];
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

export const clockinEmployee = async (
  employeeId: mongoose.Types.ObjectId,
  payload: CreateClockinPayload
) => {
  // Step 1: Check if attendance already marked for today
  if (await Attendance.isAttendanceAlreadyMarkedToday(employeeId, payload.officeId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Attendance already marked for today');
  }

  // Step 2: Validate employee existence
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  // Step 3: Load office configuration
  const officeConfig: IAttendanceOfficeConfigDoc | null =
    await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);

  if (!officeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  // Step 4: Load office details
  const office = await officeServices.getOfficeById(employee.officeId);
  if (!office) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office not found');
  }

  const [timezone] = office.timezone.split(' - ') ?? [];
  if (!timezone) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office timezone not found');
  }

  const todayInOfficeTime = moment.tz(timezone!);
  const todayDayName = todayInOfficeTime.format('dddd') as OfficeWorkingDaysEnum;

  // Step 5: Validate if today is a working day
  const workingDayConfig = officeConfig.workingDays.find((day) => day.day === todayDayName);
  const isWorkingDay = checkWorkingDay(officeConfig.workingDays.map((day) => day.day), todayDayName);

  if (!isWorkingDay) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Today is not a working day');
  }

  // Step 6: Determine time-based validations
  let isWithinWorkingHours = false;
  if (officeConfig.scheduleType === OfficeScheduleTypeEnum.CLOCK) {
    const currentTime = todayInOfficeTime.clone().set({
      hour: todayInOfficeTime.hour(),
      minute: todayInOfficeTime.minute(),
    });

    const officeStartTime = attendanceUtils.parseOfficeTimes(
      workingDayConfig!.schedule?.startTime!,
      timezone!
    );

    const officeEndTime = attendanceUtils.parseOfficeTimes(
      workingDayConfig!.schedule?.endTime!,
      timezone!
    );

    isWithinWorkingHours = moment(currentTime).isBetween(officeStartTime, officeEndTime);

    if (!isWithinWorkingHours) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot clock in outside working hours');
    }
  }

  // Step 8: Create attendance record
  const attendance = await Attendance.create({
    employeeId,
    ...payload,
    clockinTime: attendanceUtils
      .parseOfficeTimes(payload.clockinTime as unknown as string, timezone!)
      .toDate(),
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

  const isWorkingDay = loadOfficeConfig.workingDays.find((day) => day.day === todayDayName) ?? false;

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

export const getEmployeeMonthlySummary = async (
  employeeId: mongoose.Types.ObjectId
): Promise<{
  year: number;
  month: number;
  weeklyWorkingHours: number;
  monthlyWorkingHours: number;
  totalLoggedHours: number;
  totalOvertimeHours: number;
  totalPaidTimeOff: number;
}> => {
  // Step 1: Validate the employee
  const employee = await employeeService.getEmployeeByUserId(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  // Step 2: Retrieve office configuration
  const officeConfig: IAttendanceOfficeConfigDoc | null =
    await attendanceOfficeConfigService.findOfficeConfig(employee.officeId);
  if (!officeConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office config not found');
  }

  // Step 3: Calculate month range
  const now = moment();
  const year = now.year();
  const month = now.month() + 1;
  const startDate = now.clone().startOf('month').toDate();
  const endDate = now.clone().endOf('month').toDate();

  // Step 4: Fetch attendance records
  const attendanceRecords: IAttendanceDoc[] =
    await getEmployeeAttendanceRecords(employeeId, startDate, endDate);

  // Step 5: Calculate working hours
  const dailyWorkingHours = officeConfig.workingDays
    .filter((day) => day.isActive) // Only include active working days
    .reduce((totalHours, day) => {
      const startTime = moment(day?.schedule?.startTime!, 'HH:mm');
      const endTime = moment(day?.schedule?.endTime!, 'HH:mm');
      const dailyHours = moment.duration(endTime.diff(startTime)).asHours();
      return totalHours + dailyHours;
    }, 0);

  const activeWorkingDays = officeConfig.workingDays.filter(
    (day) => day.isActive
  ).length;

  const weeklyWorkingHours = dailyWorkingHours * activeWorkingDays;
  const totalWeeksInMonth = Math.ceil(endDate.getDate() / 7);
  const monthlyWorkingHours = weeklyWorkingHours * totalWeeksInMonth;

  // Step 6: Process attendance records
  let totalLoggedHours = 0;
  let totalOvertimeHours = 0;
  let totalPaidTimeOff = 0; // Placeholder for PTO calculation

  attendanceRecords.forEach((record) => {
    const loggedHours = record.totalLoggedHours || 0;
    totalLoggedHours += loggedHours;

    // Calculate overtime
    if (loggedHours > dailyWorkingHours) {
      totalOvertimeHours += loggedHours - dailyWorkingHours;
    }
  });

  // Step 7: Return formatted summary
  return {
    year,
    month,
    weeklyWorkingHours: +weeklyWorkingHours.toFixed(2),
    monthlyWorkingHours: +monthlyWorkingHours.toFixed(2),
    totalLoggedHours: +totalLoggedHours.toFixed(2),
    totalOvertimeHours: +totalOvertimeHours.toFixed(2),
    totalPaidTimeOff, // Placeholder
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
