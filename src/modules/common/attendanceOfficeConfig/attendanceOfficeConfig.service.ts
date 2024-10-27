import { attendanceConfigInterface, AttendanceOfficeConfig } from '.';

export const saveOfficeConfig = async (config: attendanceConfigInterface.IAttendanceOfficeConfig) => {
  const officeConfig = await AttendanceOfficeConfig.create(config);
  return officeConfig;
};

export const findOfficeConfig = async (officeId: string) => {
  const officeConfig = await AttendanceOfficeConfig.findOne({ officeId });
  return officeConfig;
};
