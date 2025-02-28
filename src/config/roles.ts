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
    'getAttendanceconfig',
    'addHoliday',
    'editJobTitle',
    'sendMessage',
    'getClockinButtonStatus',
    'clockin',
    'clockout'
  ],
  employee: ['profile', 'getClockinButtonStatus', 'getMyAttendance', 'clockin', 'clockout', 'sendMessage'],
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
    'getJobTitles',
    'sendMessage',
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

export enum ActionEnum {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}
