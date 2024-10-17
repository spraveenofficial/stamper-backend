import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync, pick } from '../utils';
import { newsService } from '.';
import { rolesEnum } from '../../config/roles';
import mongoose from 'mongoose';
import { IOptions } from '../paginate/paginate';

export const createNews = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user;
  const { id: organizationId } = req.organization;

  const news = await newsService.createNews(req.body, userId, organizationId);
  return res.status(httpStatus.CREATED).json({ success: true, message: req.t('News.newsAddSuccess'), data: news });
});

export const getLatestNews = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;
  const options: IOptions = pick(req.query, ['limit', 'page']);
  const { id: organizationId } = req.organization;

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

  if (news.createdBy.toString() !== userId) {
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

  if (news.createdBy.toString() !== userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: req.t('News.notAuthorizedToPerformAction') });
  }

  const updatedNews = await newsService.updateNewsById(id as string, req.body);
  return res.status(httpStatus.OK).json({ success: true, data: updatedNews, message: req.t('News.newsUpdateSuccess') });
});
