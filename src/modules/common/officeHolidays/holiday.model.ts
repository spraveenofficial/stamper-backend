import mongoose from 'mongoose';
import { IHolidayDoc, IHolidayModel } from './holidays.interfaces';
import { toJSON } from '../../../modules/toJSON';

const Schema = mongoose.Schema;

const holidayListSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: false,
    default: null
  },
});

const holidaySchema = new Schema<IHolidayDoc, IHolidayModel>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Organization',
    },
    officeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Office',
    },
    financialYear: {
      type: Number,
      required: true,
    },
    holidayList: [holidayListSchema],
    addedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

holidayListSchema.plugin(toJSON);

holidaySchema.statics['isHolidayAlreadyExist'] = async function (date: string, organizationId: mongoose.Types.ObjectId) {
  const holiday = await this.findOne({
    organizationId,
    'holidayList.date': date,
  });
  return !!holiday;
};

holidaySchema.statics['isHolidayExistForFinancialYear'] = async function (
  officeId: mongoose.Types.ObjectId,
  financialYear: number
) {
  const holiday = await this.findOne({
    officeId,
    financialYear,
  });
  return !!holiday;
};

const Holiday = mongoose.model<IHolidayDoc, IHolidayModel>('Holiday', holidaySchema);

export default Holiday;
