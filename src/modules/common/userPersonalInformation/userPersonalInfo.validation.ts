import Joi from 'joi';
import { GenderEnum, MaritalStatusEnum, NewUserPersonalInfoPayload } from './userPersonalInfo.interface'; // Path to your interface

export const userPersonalInfoValidationSchema = Joi.object<NewUserPersonalInfoPayload>({
  userTimezone: Joi.string().optional().default('UTC'), // Optional with default value
  gender: Joi.string()
    .valid(...Object.values(GenderEnum)) // Replace with GenderEnum values
    .optional(),
  maritalStatus: Joi.string()
    .valid(...Object.values(MaritalStatusEnum)) // Replace with MaritalStatusEnum values
    .optional(),
  personalEmail: Joi.string().email().optional(), // Optional email
  dateOfBirth: Joi.date().iso().optional(), // Optional ISO date
  address: Joi.string().optional(), // Optional string
  country: Joi.string().optional(), // Optional string
  state: Joi.string().optional(), // Optional string
  city: Joi.string().optional(), // Optional string
  zipCode: Joi.string().optional(), // Optional string
  nationality: Joi.string().optional(), // Optional string
  personalTaxId: Joi.string().optional(), // Optional string
  emergencyContactDetails: Joi.array()
    .items(
      Joi.object({
        name: Joi.string(),
        relationship: Joi.string(),
        phone: Joi.string(),
      })
    )
    .optional(),
  bankAccountDetails: Joi.array()
    .items(
      Joi.object({
        bankName: Joi.string(),
        accountNumber: Joi.string(),
        accountHolderName: Joi.string(),
        branchName: Joi.string(),
        ifscCode: Joi.string(),
      })
    )
    .optional(),
});
