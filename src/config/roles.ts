const allRoles = {
  organization: [
    'profile',
    'addEmployee',
    'addOrganization',
    'getEmployees',
    'editLeaveStatus',
    'addOffice',
    'getOffices',
    'editOffice',
    'addDepartment',
    'getDepartments',
    'addJobTitle',
    'getJobTitles',
    'createDocumentFolder',
    'createNews',
    'deleteNews',
    'updateNews',
    'addLeaveType',
    'addLeavePolicy',
    'editOfficeManager',
    'addAttendanceconfig',
    'getAttendanceconfig',
    'addHoliday',
  ],
  employee: ['profile', 'getClockinButtonStatus', 'getMyAttendance', 'clockin', 'clockout'],
  admin: ['profile'],
  moderator: [
    'profile',
    'getClockinButtonStatus',
    'getAttendanceconfig',
    'getMyAttendance',
    'getEmployees',
    'clockin',
    'clockout',
    'addHoliday',
  ],
};

export enum DevelopmentOptions {
  development = 'development',
  production = 'production',
}

export const roles: string[] = Object.keys(allRoles);
export const roleRights: Map<string, string[]> = new Map(Object.entries(allRoles));

export enum rolesEnum {
  organization = 'organization',
  employee = 'employee',
  admin = 'admin',
  moderator = 'moderator',
}
