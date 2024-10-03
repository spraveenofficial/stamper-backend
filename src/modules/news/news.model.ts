import { rolesEnum } from '../../config/roles';
import { toJSON } from '../toJSON';
import mongoose, { Schema } from 'mongoose';
import { INewsDoc, INewsModel, NewsStatus } from './news.interfaces';

const newsSchema = new Schema<INewsDoc, INewsModel>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: NewsStatus,
      required: true,
    },
    access: {
      type: [String],
      enum: rolesEnum,
      default: [rolesEnum.employee, rolesEnum.organization],
    },
    scheduledAt: {
      type: Date,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  { timestamps: true }
);

newsSchema.plugin(toJSON);

const News = mongoose.model<INewsDoc, INewsModel>('News', newsSchema);

export default News;
