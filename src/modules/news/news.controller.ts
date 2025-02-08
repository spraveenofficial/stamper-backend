import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { newsService } from '.';
import { rolesEnum } from '../../config/roles';
import { BULL_AVAILABLE_JOBS, newNewsQueue } from '../bullmqs';
import { catchAsync, pick } from '../utils';
import { INewsDoc, NewsStatus } from './news.interfaces';

export const createNews = catchAsync(async (req: Request, res: Response) => {
  const { id: userId, role } = req.user;
  const { title } = req.body;
  const { organizationId } = req.organizationContext;

  let news: INewsDoc | null = await newsService.createNews(req.body, userId, new mongoose.Types.ObjectId(organizationId))

  await newNewsQueue.add('sendNotifications', {
    userId,
    organizationId:
      role === rolesEnum.organization
        ? req.organization.id
        : 'officeId' in req.organization && req.organization.organizationId,
    newsTitle: title,
    newsId: news!._id,
    targetRole: 'employee', // or based on your logic to target specific roles
    type: BULL_AVAILABLE_JOBS.NEWS_PUBLICATION_NOTIFICATION,
  });

  return res.status(httpStatus.CREATED).json({ success: true, message: req.t('News.newsAddSuccess'), data: news });
});

export const getLatestNews = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.user;
  const { limit, page, status } = pick(req.query, ['limit', 'page', 'status']);
  const { organizationId } = req.organizationContext
  const pageToFn = Math.max(1, +page! || 1); // Default to page 1
  const limitToFn = Math.max(1, +limit! || 10); // Default to limit 10

  let news = await newsService.getLatestNews(
    organizationId as mongoose.Types.ObjectId,
    role as rolesEnum,
    pageToFn,
    limitToFn,
    status as NewsStatus
  );
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
