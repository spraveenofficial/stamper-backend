import { OfficeWorkingDaysEnum } from '../common/attendanceOfficeConfig/attendanceOfficeConfig.interface';
import moment from 'moment-timezone';

/**
 *
 * @param officeWorkingDays
 * @param dayName
 * @returns boolean
 */
export const checkWorkingDay = (officeWorkingDays: OfficeWorkingDaysEnum[], dayName: string): boolean => {
  return officeWorkingDays.includes(dayName as OfficeWorkingDaysEnum);
};

/**
 *
 * @param time
 * @param timezone
 * @returns moment.Moment
 */

export const parseOfficeTimes = (time: string, timezone: string) => {
    return moment.tz(time, 'HH:mm', timezone).set({
      year: moment().year(),
      month: moment().month(),
      date: moment().date()
    });
  };

export const isTimeWithinRange = (currentTime: moment.Moment, startTime: moment.Moment, endTime: moment.Moment): boolean => {
  return currentTime.isBetween(startTime, endTime);
};
