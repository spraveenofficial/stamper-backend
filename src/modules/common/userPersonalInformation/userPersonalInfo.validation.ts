import Joi from 'joi';
import { GenderEnum, MaritalStatusEnum } from './userPersonalInfo.interface'; // Path to your interface

const userPersonalInfoValidation = Joi.object<any>({
  name: Joi.string().optional(), // Required string
  phoneNumber: Joi.string().optional(), // Optional string
  userTimezone: Joi.string().optional(), // Optional with default value
  gender: Joi.string()
    .valid(...Object.values(GenderEnum)) // Replace with GenderEnum values
    .allow(null) // Allow null if needed
    .optional(),
  maritalStatus: Joi.string()
    .valid(...Object.values(MaritalStatusEnum)) // Replace with MaritalStatusEnum values
    .allow(null) // Allow null if needed
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
        _id: Joi.string().optional(), // Optional within the array if present
        name: Joi.string().required(), // Required within the array if present
        relationship: Joi.string().required(), // Required within the array if present
        phone: Joi.string().required(), // Required within the array if present
        email: Joi.string().email().required(), // Required within the array if present
        createdAt: Joi.date().iso().optional(), // Required within the array if present
        updatedAt: Joi.date().iso().optional(), // Required within the array if present
      })
    )
    .optional(),
  bankAccountDetails: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(), // Optional within the array if present
        bankName: Joi.string().required(), // Required within the array if present
        accountNumber: Joi.string().required(), // Required within the array if present
        accountHolderName: Joi.string().required(), // Required within the array if present
        branchName: Joi.string().required(), // Required within the array if present
        ifscCode: Joi.string().required(), // Required within the array if present
        isPrimary: Joi.boolean().required(), // Required within the array if present
        createdAt: Joi.date().iso().optional(), // Required within the array if present
        updatedAt: Joi.date().iso().optional(), // Required within the array if present
      })
    )
    .optional(),
});

export const userPersonalInfoValidationSchema = {
  body: userPersonalInfoValidation,
};
