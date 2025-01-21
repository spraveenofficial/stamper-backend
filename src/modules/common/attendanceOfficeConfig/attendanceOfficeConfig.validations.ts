import Joi from 'joi';
import { attendanceConfigInterface } from '.';
import { objectId } from '../../../modules/validate';
import { IAttendanceWorkingDaysConfig } from './attendanceOfficeConfig.interface';

const attendanceWorkingDaysConfigSchema = Joi.object<IAttendanceWorkingDaysConfig>({
  day: Joi.string().valid(...Object.values(attendanceConfigInterface.OfficeWorkingDaysEnum)).required(),
  schedule: Joi.object({
    startTime: Joi.string().when('scheduleType', { is: attendanceConfigInterface.OfficeScheduleTypeEnum.CLOCK, then: Joi.required() }),
    endTime: Joi.string().when('scheduleType', { is: attendanceConfigInterface.OfficeScheduleTypeEnum.CLOCK, then: Joi.required() }),
    hours: Joi.number().when('scheduleType', { is: attendanceConfigInterface.OfficeScheduleTypeEnum.DURATION, then: Joi.required() }),
  }).required(),
});

const addAttendanceConfigRequestSchema: Record<keyof attendanceConfigInterface.NewAttendanceConfigPayload, any> = {
  policyTitle: Joi.string().required(),
  scheduleType: Joi.string().valid(...Object.values(attendanceConfigInterface.OfficeScheduleTypeEnum)).required(),
  officeId: Joi.string().custom(objectId).required(),
  clockinMode: Joi.string().valid(...Object.values(attendanceConfigInterface.AttendanceClockinAndClockoutMode)).required(),
  effectiveFrom: Joi.date().required(),
  geofencing: Joi.boolean().required().allow(null),
  workingDays: Joi.array().items(attendanceWorkingDaysConfigSchema)
    .required()
    .min(1),
  radius: Joi.number().optional().allow(null),
  officeLocationText: Joi.string().required(),
  qrEnabled: Joi.boolean().required(),
  officeLocation: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).required(),
  }).required(),
  standardHoursInADay: Joi.number().required(),
};

const addWorkScheduleRequestSchema: Record<keyof attendanceConfigInterface.NewWorkSchedulePayload, any> = {
  policyTitle: Joi.string().required(),
  scheduleType: Joi.string().valid(...Object.values(attendanceConfigInterface.OfficeScheduleTypeEnum)).required(),
  officeId: Joi.string().custom(objectId).required(),
  effectiveFrom: Joi.date().required(),
  workingDays: Joi.array().items(attendanceWorkingDaysConfigSchema)
    .required()
    .min(1),
  standardHoursInADay: Joi.number().required(),
};

export const addAttendanceConfigRequest = {
  body: Joi.object(addAttendanceConfigRequestSchema),
};

export const addWorkScheduleRequest = {
  body: Joi.object(addWorkScheduleRequestSchema),
}

export const getWorkScheduleByOfficeIdRequest = {
  params: {
    officeId: Joi.string().custom(objectId).required(),
  },
}