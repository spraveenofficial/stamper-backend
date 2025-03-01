import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { documentService } from '.';
// import { rolesEnum } from '../../config/roles';
import { ApiError } from '../errors';
import { organizationService } from '../organization';
import { catchAsync } from '../utils';
import { User } from '../user';
import mongoose from 'mongoose';
import { getEmployeeByUserId } from '../employee/employee.service';
import { rolesEnum } from '../../config/roles';
import { deleteFolderService } from './documents.service';


export const createFolder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);

  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }
  // console.log("THe orgranization is: ", organization);
  if(req.body.access.includes("department")){
    const userId = organization.userId!.toString();
    const getDepartmentId = await getEmployeeByUserId(new mongoose.Types.ObjectId(userId));
    req.body.departmentId = new mongoose.Types.ObjectId(getDepartmentId?.departmentId);
  }
  const folder = await documentService.createFolder(req.body, organization.id, id);

  res.status(httpStatus.CREATED).send(folder);
});
export const getFolders = catchAsync(async (req: Request, res: Response) => {
  const { organizationId } = req.organizationContext;
  console.log("The organization context is: ", req.organizationContext);
  console.log("The user is: ", req.user);

  const getEmail = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user.id)
      },
    },
    {
      $unwind: "$email"
    },
    {
      $project: {
        email: 1
      }
    }
  ])

  if(!getEmail){
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email not found');
  }
  // console.log("The get Email is: ", getEmail);

  let getDepartmentId = null; 
  if(req.user.role !== rolesEnum.organization){
    const userId = req.organizationContext.originalData.userId!.toString();
    getDepartmentId = await getEmployeeByUserId(new mongoose.Types.ObjectId(userId));
  }

  const folders = await documentService.getFolders(organizationId, req.user.id, getEmail[0]?.email,  getDepartmentId?.departmentId ?? undefined);

  res.status(httpStatus.OK).json({ success: true, data: folders });
});

export const deleteFolder = catchAsync(async (req: Request, res: Response)=>{
  const { documentId } = req.params;
  const id = new mongoose.Types.ObjectId(documentId);
  await deleteFolderService(id); 
  res.status(httpStatus.OK).json({ success: true, message: 'Folder deleted successfully' });
});


export const updateFolder = catchAsync(async (req: Request, res: Response)=>{
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);

  if (!organization) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Add organization first');
  }

  if(req.body.access.includes("department")){
    const userId = organization.userId!.toString();
    const getDepartmentId = await getEmployeeByUserId(new mongoose.Types.ObjectId(userId));
    req.body.departmentId = new mongoose.Types.ObjectId(getDepartmentId?.departmentId);
  }

  const folder = await documentService.updateFolder(req.body, organization.id, id);

  res.status(httpStatus.CREATED).send(folder);
})


export const getEmployee = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const relatedEmails = await documentService.getEmailMatched(payload.payload);

  res.status(httpStatus.OK).json({ success: true, data: relatedEmails });
})