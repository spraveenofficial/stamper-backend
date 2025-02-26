import mongoose from 'mongoose';
import { IDocumentDoc, NewDocumentType } from './documents.interfaces';
import Document from './documents.model';
import { ApiError } from '../errors';
import { rolesEnum } from 'src/config/roles';
import { User } from '../user';

export const createFolder = async (
  payload: NewDocumentType,
  organizationId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId
): Promise<IDocumentDoc> => {
  if (await Document.isFolderAlreadyAdded(payload.folderName, organizationId)) {
    throw new ApiError(400, 'Folder already exists');
  }
  return await Document.create({ ...payload, organizationId, createdBy });
};

export const getFolders = async (organizationId: mongoose.Types.ObjectId, role: rolesEnum): Promise<IDocumentDoc[]> => {
  // Create a aggregation pipeline to get folders with createdBy user details and to match the access roles
  const organization = new mongoose.Types.ObjectId(organizationId);
  
  const folders = await Document.aggregate([
    { $match: { organizationId: organization, $or: [{ access: { $in: [role] } }] } },
    { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdByInfo' } },
    { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        createdBy: '$createdByInfo.name',
        createdByProfilePic: '$createdByInfo.profilePic',
        folderId: '$_id',
        filesCount: { $cond: { if: { $isArray: '$documents' }, then: { $size: '$documents' }, else: 0 } },
      },
    },
    { $project: { createdByInfo: 0, __v: 0, updatedAt: 0, organizationId: 0, _id: 0, documents:  0 } },
  ]);
  return folders;
};


export const getEmailMatched = async (payload: string): Promise<any> => {

  
    const data = await User.aggregate([
      {
        $match: {
          email: { $regex: `^${payload}`, $options: 'i' }
        }
      },
      {
        $project: {
          email: 1
        }
      },
      {
        $limit: 10
      }
    ])

    return data;
}