import moment from 'moment-timezone';
import { ApiError } from '../errors';
import httpStatus from 'http-status';
import { attendanceOfficeConfigService } from '../common/attendanceOfficeConfig';
import { officeServices } from '../office';
import mongoose from 'mongoose';
import { employeeService } from '../employee';

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

  const [timezone, _offset] = office.timezone.split(' - ');

  // Get the current date and time in the specified timezone
  const todayInOfficeTime = moment.tz(timezone!);

  //@ts-ignore
  // Get the UTC offset in the format +05:30
  const _utcOffset = todayInOfficeTime.format('Z'); // This will give you +05:30
  //@ts-ignore
  // Get the UTC offset in numerical format +5.5
  const utcOffsetNumeric = todayInOfficeTime.utcOffset() / 60; // This will give you +5.5

  // @ts-ignore
  const todayDayName = todayInOfficeTime.format('dddd');

  // Now you can check if today is a working day in the office
  if (loadOfficeConfig.officeWorkingDays.includes(todayDayName)) {
    console.log('Today is a working day in the office.');
    // return true; // Today is a working day in the office
  } else {
    console.log('Today is not a working day in the office.');
  }

  //   return false; // Today is not a working day in the office

  //   Check with the employee's working hours
  const currentHour = todayInOfficeTime.hour();
  const currentMinute = todayInOfficeTime.minute();
  const currentTime = `${currentHour}:${currentMinute}`;

  const officeStartTime = moment(loadOfficeConfig?.officeStartTime, 'HH:mm');
  const officeEndTime = moment(loadOfficeConfig?.officeEndTime, 'HH:mm');

  // Check if the current time is within the office working hours
  if (moment(currentTime, 'HH:mm').isBetween(officeStartTime, officeEndTime)) {
    console.log('Employee is within the office working hours.');
  } else {
    console.log('Employee is not within the office working hours.');
  }

  return true;
};
