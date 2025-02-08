import { IOfficeAttendanceConfig } from "../office/office.interfaces";
import Office from "../office/office.model";

const defaultAttendanceConfig: Partial<IOfficeAttendanceConfig> = {
    regularizationCycleType: 'Monthly',
    regularizationCycleStartsOnDate: 1,
    regularizationReasonRequired: true,
    regularizationReasons: [],
    regularizationAllowedTypes: [],
    canEmployeeEditAttendance: true,
    employeeCanEditAttendanceForLastDays: 7,
};

const migrateOffices = async () => {
    try {
        const offices = await Office.find({});
        console.log('Offices Found:', offices.length);

        for (const office of offices) {
            office.attendanceConfig = defaultAttendanceConfig as IOfficeAttendanceConfig;
            await office.save();

            console.log(`Updated office with ID: ${office._id}`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}
export { migrateOffices };
