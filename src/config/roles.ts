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
  ],
  employee: ['profile'],
  admin: ['profile'],
  moderator: ['profile'],
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
