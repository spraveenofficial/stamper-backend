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

const updateOfficeAttendanceConfig: Record<keyof attendanceConfigInterface.AttendanceConfigPayload, any> = {
  policyTitle: Joi.string().required(),
  officeId: Joi.string().custom(objectId).required(),
  clockinMode: Joi.string().valid(...Object.values(attendanceConfigInterface.AttendanceClockinAndClockoutMode)).required(),
  geofencing: Joi.boolean().required().allow(null),
  radius: Joi.number().optional().allow(null),
  officeLocationText: Joi.string().required(),
  qrEnabled: Joi.boolean().required(),
  officeLocation: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).required(),
  }).required(),
  selfieRequired: Joi.boolean().required(),
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

const updateWorkScheduleRequestSchema: Record<keyof attendanceConfigInterface.UpdateWorkSchedulePayload, any> = {
  id: Joi.string().custom(objectId).required(),
  policyTitle: Joi.string().optional(),
  scheduleType: Joi.string().valid(...Object.values(attendanceConfigInterface.OfficeScheduleTypeEnum)).optional(),
  officeId: Joi.string().custom(objectId).optional(),
  effectiveFrom: Joi.date().optional(),
  workingDays: Joi.array().items(attendanceWorkingDaysConfigSchema)
    .optional()
    .min(1),
  standardHoursInADay: Joi.number().optional(),
  isActive: Joi.boolean().optional(),
  selfieRequired: Joi.boolean().optional(),
  clockinMode: Joi.string().valid(...Object.values(attendanceConfigInterface.AttendanceClockinAndClockoutMode)).optional(),
  geofencing: Joi.boolean().optional().allow(null),
  radius: Joi.number().optional().allow(null),
  officeLocationText: Joi.string().optional(),
  qrEnabled: Joi.boolean().optional(),
  officeLocation: Joi.object({
    type: Joi.string().valid('Point').optional(),
    coordinates: Joi.array().items(Joi.number()).optional(),
  }).optional(),
  addedBy: Joi.string().custom(objectId).optional(),
  organizationId: Joi.string().custom(objectId).optional(),
};

export const addAttendanceConfigRequest = {
  body: Joi.object(updateOfficeAttendanceConfig),
};

export const addWorkScheduleRequest = {
  body: Joi.object(addWorkScheduleRequestSchema),
}

export const updateWorkScheduleRequest = {
  body: Joi.object(updateWorkScheduleRequestSchema),
}

export const getWorkScheduleByOfficeIdRequest = {
  params: {
    officeId: Joi.string().custom(objectId).required(),
  },
}