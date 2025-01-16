import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Office } from '.';
import { ApiError } from '../errors';
import { IOffice, IOfficeDoc, NewAddOffice } from './office.interfaces';

export const addOffice = async (
  payload: NewAddOffice,
  addedBy: mongoose.Types.ObjectId,
  orgId: mongoose.Types.ObjectId
): Promise<IOffice> => {
  if (payload.isHeadQuarter && (await Office.isHeadQuarterAdded(orgId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One organization cannot have more than one headquarter.'); // Throw the error instead of returning it
  }
  if (await Office.isOfficeAddedByUser(orgId, payload.name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Office Already Added'); // Throw the error instead of returning it
  }
  return await Office.create({ ...payload, addedBy, managerId: addedBy, organizationId: orgId });
};

export const changeOfficeOperationalStatus = async (
  officeId: mongoose.Types.ObjectId,
  status: boolean
): Promise<IOffice | null> => {
  return await Office.findByIdAndUpdate(officeId, { isOperational: status }, { new: true });
};

export const getOffices = async (
  orgId: mongoose.Types.ObjectId,
  officeId?: mongoose.Types.ObjectId,
  page: number = 1,
  limit: number = 10
): Promise<IOffice[]> => {
  const skip = (page - 1) * limit;
  let query: any = { organizationId: new mongoose.Types.ObjectId(orgId) };

  if (officeId) {
    query._id = new mongoose.Types.ObjectId(officeId);
  }

  const offices = await Office.aggregate([
    { $match: query },
    { $lookup: { from: 'users', localField: 'managerId', foreignField: '_id', as: 'managerDetails' } },
    { $unwind: { path: '$managerDetails', preserveNullAndEmptyArrays: true } },
    { $addFields: { officeId: '$_id', managerName: '$managerDetails.name', managerEmail: '$managerDetails.email' } },
    {
      $project: {
        managerDetails: 0,
        _id: 0,
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
        addedBy: 0,
        organizationId: 0,
        managerId: 0,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [
          { $count: 'totalCount' }, // Count total documents
          { $addFields: { page, limit } }, // Include page and limit in metadata
        ],
        data: [
          { $skip: skip }, // Skip for pagination
          { $limit: limit }, // Limit the number of results
        ],
      },
    },
    {
      $unwind: '$metadata', // Unwind the metadata array
    },
    {
      $project: {
        results: '$data',
        page: '$metadata.page',
        limit: '$metadata.limit',
        totalResults: '$metadata.totalCount',
        totalPages: {
          $ceil: { $divide: ['$metadata.totalCount', '$metadata.limit'] },
        },
      },
    },
  ]);

  return offices.length ? offices[0] : { results: [], page: 1, limit, totalResults: 0, totalPages: 0 };
};

export const editOffice = async (officeId: mongoose.Types.ObjectId, payload: Partial<IOffice>): Promise<IOffice | null> => {
  const office = await Office.findById(officeId);
  if (!office) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Office not found');
  }
  if (await Office.isOfficeAddedByUser(office.organizationId, payload.name!)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One organization cannot have more than one office of same name');
  }
  await office.updateOne(payload);
  return office;
};

export const getOfficeById = async (officeId: mongoose.Types.ObjectId): Promise<IOfficeDoc | null> => {
  return await Office.findById(officeId);
};

export const getOfficeByOrgAndEmpId = async (
  orgId: mongoose.Types.ObjectId,
  empId: mongoose.Types.ObjectId
): Promise<IOfficeDoc | null> => {
  return await Office.findOne({
    organizationId: new mongoose.Types.ObjectId(orgId),
    managerId: new mongoose.Types.ObjectId(empId),
  });
};