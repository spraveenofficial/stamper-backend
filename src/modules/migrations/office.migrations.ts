import { IOfficeAttendanceConfig } from "../office/office.interfaces";
import Office from "../office/office.model";

const defaultAttendanceConfig: IOfficeAttendanceConfig = {
    totalHoursCalculation: "Default", // Default to 'Default'
    attendanceApprovalCycle: {
        startDay: 1, // Default to the 1st day of the month
        frequency: 'Monthly', // Default to 'Monthly'
    }
};

const migrateOffices = async () => {
    try {
        const offices = await Office.find({});
        console.log('Offices Found:', offices.length);

        for (const office of offices) {
            office.attendanceConfig = defaultAttendanceConfig;
            await office.save();

            console.log(`Updated office with ID: ${office._id}`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}
export { migrateOffices };