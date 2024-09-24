import { Office } from '.';
import { IOffice, NewAddOffice } from './office.interfaces';

export const addOffice = async (payload: NewAddOffice): Promise<IOffice> => {
  return await Office.create(payload);
};
