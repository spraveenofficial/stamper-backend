import mongoose from 'mongoose';
import { IDocumentDoc, NewDocumentType } from './documents.interfaces';
import Document from './documents.model';
import { ApiError } from '../errors';
// import { rolesEnum } from 'src/config/roles';
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

export const getFolders = async (organizationId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId, email: string, departmentId?: mongoose.Types.ObjectId): Promise<IDocumentDoc[]> => {
  // Create a aggregation pipeline to get folders with createdBy user details and to match the access roles
  const organization = new mongoose.Types.ObjectId(organizationId);
  const id = new mongoose.Types.ObjectId(userId);

  const folders = await Document.aggregate([
    {
      $match: {
        organizationId: organization,
        $or: [
          {access: { $in: ["everyone"] }},
          { access: {$in: ["me"] }, createdBy: id },
          {access: {$in: ["department"]}, departmentId: departmentId},
          {employees: {$in: [email]}},
          { createdBy: id }
        ]
      }
    },
    {
      $lookup: {
        from: "users", // Name of the User collection
        localField: "createdBy",
        foreignField: "_id",
        as: "creatorInfo"
      }
    },
    {
      $unwind: "$creatorInfo" // Convert the array into an object
    },
    {
      $project: {
        folderName: 1,
        access: 1,
        organizationId: 1,
        description: 1,
        employees: 1,
        createdBy: "$creatorInfo.name" // Get only the creator's name
      }
    }
  ]);


  // const folders = await Document.aggregate([
  //   { $match: { organizationId: organization, $or: [{ access: { $in: [role] } }] } },
  //   { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdByInfo' } },
  //   { $unwind: { path: '$createdByInfo', preserveNullAndEmptyArrays: true } },
  //   {
  //     $addFields: {
  //       createdBy: '$createdByInfo.name',
  //       createdByProfilePic: '$createdByInfo.profilePic',
  //       folderId: '$_id',
  //       filesCount: { $cond: { if: { $isArray: '$documents' }, then: { $size: '$documents' }, else: 0 } },
  //     },
  //   },
  //   { $project: { createdByInfo: 0, __v: 0, updatedAt: 0, organizationId: 0, _id: 0, documents:  0 } },
  // ]);
  return folders;
};

export const deleteFolderService = async (documentId: mongoose.Types.ObjectId): Promise<boolean> =>{
      const result = await Document.deleteOne({_id: documentId});
      if (result.deletedCount === 0) {
        throw new Error("Folder not found or already deleted");
      }
      return true;
}

export const updateFolder = async (
  payload: NewDocumentType,
  organizationId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId
): Promise<IDocumentDoc | null> => {
  return await Document.findOneAndUpdate(
    { _id: payload._id, organizationId, createdBy }, 
    { $set: payload }, 
    { new: true, runValidators: true }
  );
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