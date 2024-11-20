import { objectId } from '../../../modules/validate';
import { attendanceConfigInterface } from '.';
import Joi from 'joi';

const addAttendanceConfigRequestSchema: Record<keyof attendanceConfigInterface.NewAttendanceConfigPayload, any> = {
  officeId: Joi.string().custom(objectId).required(),
  policyDescription: Joi.string().required(),
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
  officeStartTime: Joi.string().required(),
  officeEndTime: Joi.string().required(),
  officeBreakStartTime: Joi.string().required(),
  officeBreakEndTime: Joi.string().required(),
  officeBreakDurationInMinutes: Joi.number().required(),
  officeWorkingDays: Joi.array()
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
