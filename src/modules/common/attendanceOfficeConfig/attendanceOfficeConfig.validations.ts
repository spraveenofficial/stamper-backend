import Joi from 'joi';
import { attendanceConfigInterface } from '.';
import { objectId } from '../../../modules/validate';

const addAttendanceConfigRequestSchema: Record<keyof attendanceConfigInterface.NewAttendanceConfigPayload, any> = {
  officeId: Joi.string().custom(objectId).required(),
  policyTitle: Joi.string().required(),
  scheduleType: Joi.string().valid(...Object.values(attendanceConfigInterface.OfficeScheduleTypeEnum)).required(),
  officeLocation: Joi.object()
    .keys({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(Joi.number()).when('geofencing', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    })
    .required(),
  clockinMode: Joi.array()
    .items(
      Joi.string()
        .valid(...Object.values(attendanceConfigInterface.AttendanceClockinAndClockoutMode))
        .required()
    )
    .required(),
  geofencing: Joi.boolean().required(),
  qrEnabled: Joi.boolean().required(),
  radius: Joi.number().when('geofencing', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  officeLocationText: Joi.string().when('geofencing', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  workingDays: Joi.array()
    .items(
      Joi.string()
        .valid(...Object.values(attendanceConfigInterface.OfficeWorkingDaysEnum))
        .required()
    )
    .required(),
};

export const addAttendanceConfigRequest = {
  body: Joi.object(addAttendanceConfigRequestSchema),
};
