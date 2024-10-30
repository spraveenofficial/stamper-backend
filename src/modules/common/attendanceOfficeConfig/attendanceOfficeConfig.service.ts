import mongoose from 'mongoose';
import { attendanceConfigInterface, AttendanceOfficeConfig } from '.';

export const saveOfficeConfig = async (
  config: attendanceConfigInterface.NewAttendanceConfigPayload,
  orgId: mongoose.Types.ObjectId
) => {
  const officeConfig = await AttendanceOfficeConfig.create({ organizationId: orgId, ...config });
  return officeConfig;
};

export const findOfficeConfig = async (officeId: string) => {
  const officeConfig = await AttendanceOfficeConfig.findOne({ officeId });
  return officeConfig;
};

export const isUserIsWithinGeofence = async (userLongitude: number, userLatitude: number) => {
  // Fetch geofence with center and radius info
  const geofence = await AttendanceOfficeConfig.findOne({
    isActive: true,
  });

  if (!geofence || !geofence.radius) {
    return false; // Return false if no geofence or radius is found
  }

  // Convert the radius from meters to radians by dividing by Earth's radius in meters
  const radiusInRadians = geofence.radius / 6378100;

  // Check if user's location falls within the geofence radius
  const isWithin = await AttendanceOfficeConfig.findOne({
    center: {
      $geoWithin: {
        $centerSphere: [[userLongitude, userLatitude], radiusInRadians],
      },
    },
    isActive: true,
  });

  return isWithin ? true : false;
};
