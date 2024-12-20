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
    'editDepartment',
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
    'editJobTitle',
  ],
  employee: ['profile', 'getClockinButtonStatus', 'getMyAttendance', 'clockin', 'clockout'],
  admin: ['profile'],
  moderator: [
    'profile',
    'getEmployee',
    'getEmployees',
    'editLeaveStatus',
    'getClockinButtonStatus',
    'getAttendanceconfig',
    'getMyAttendance',
    'clockin',
    'clockout',
    'addHoliday',
    'editDepartment',
    'editJobTitle',
    'getOffices',
    'editOffice',
    'getDepartments',
    'getJobTitles'
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
