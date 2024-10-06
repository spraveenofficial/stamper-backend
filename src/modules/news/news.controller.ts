import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { newsService } from '.';
import { organizationService } from '../organization';
import { rolesEnum } from '../../config/roles';
import { employeeService } from '../employee';
import { ApiError } from '../errors';
import mongoose from 'mongoose';
import { IOptions } from '../paginate/paginate';

export const createNews = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const organization = await organizationService.getOrganizationByUserId(id);
  if (!organization) {
    return res
      .status(httpStatus.NOT_FOUND)
      .json({ success: false, message: req.t('Auth.Departments.addOrganizationFirst') });
  }

  const news = await newsService.createNews(req.body, id, organization._id);
  return res.status(httpStatus.CREATED).json({ success: true, message: req.t('News.newsAddSuccess'), data: news });
});

export const getLatestNews = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;
  const options: IOptions = pick(req.query, ['limit', 'page']);
  let organizationId;
  if (role === rolesEnum.organization) {
    const organization = await organizationService.getOrganizationByUserId(id);
    organizationId = organization?._id;
  } else {
    const organization = await employeeService.getEmployeeByUserId(id);
    organizationId = organization?.organizationId;
  }
  if (!organizationId) {
    throw new ApiError(httpStatus.BAD_REQUEST, req.t('Auth.Departments.addOrganizationFirst'));
  }

  const page = Math.max(1, +options.page! || 1); // Default to page 1
  const limit = Math.max(1, +options.limit! || 10); // Default to limit 10

  const news = await newsService.getLatestNews(organizationId as mongoose.Types.ObjectId, role as rolesEnum, page, limit);
  return res.status(httpStatus.OK).json({ success: true, data: news, message: req.t('News.newsFetchSuccess') });
});

export const getNewsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: req.t('News.newsNotFound') });
  }

  const news = await newsService.getNewsById(id as string);
  if (!news) {
    return res.status(httpStatus.NOT_FOUND).json({ success: false, message: req.t('News.newsNotFound') });
  }

  return res.status(httpStatus.OK).json({ success: true, data: news, message: req.t('News.newsFetchSuccess') });
});


export const deleteNewsById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: req.t('News.newsNotFound') });
  }

  const news = await newsService.findNewsById(id as string);

  if (!news) {
    return res.status(httpStatus.NOT_FOUND).json({ success: false, message: req.t('News.newsNotFound') });
  }

  if(news.createdBy.toString() !== userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: req.t('News.notAuthorizedToPerformAction') });
  }

  await newsService.deleteNewsById(id as string);
  return res.status(httpStatus.OK).json({ success: true, message: req.t('News.newsDeleteSuccess') });
});

export const updateNewsById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: req.t('News.newsNotFound') });
  }

  const news = await newsService.findNewsById(id as string);

  if (!news) {
    return res.status(httpStatus.NOT_FOUND).json({ success: false, message: req.t('News.newsNotFound') });
  }

  if(news.createdBy.toString() !== userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: req.t('News.notAuthorizedToPerformAction') });
  }

  const updatedNews = await newsService.updateNewsById(id as string, req.body);
  return res.status(httpStatus.OK).json({ success: true, data: updatedNews, message: req.t('News.newsUpdateSuccess') });
});