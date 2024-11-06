import mongoose, { Document, Model } from 'mongoose';

export interface HolidayListType {
  description: string;
  date: string;
  note: string;
}

export interface IHoliday {
  organizationId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  financialYear: number;
  holidayList: HolidayListType[];
  addedBy: mongoose.Types.ObjectId;
}

export interface IHolidayDoc extends IHoliday, Document {}

export interface IHolidayModel extends Model<IHolidayDoc> {
  isHolidayAlreadyExist(date: number, organizationId: mongoose.Types.ObjectId): Promise<boolean>;
  isHolidayExistForFinancialYear(officeId: mongoose.Types.ObjectId, financialYear: number): Promise<boolean>;
}

export type NewHolidayPayloadType = Omit<IHoliday, 'addedBy' | 'organizationId'>;

export type UpdateHolidayPayloadType = Omit<IHoliday, 'addedBy' | 'organizationId' | 'officeId'> & {
  holidayId: mongoose.Types.ObjectId;
};
