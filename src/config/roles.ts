const allRoles = {
  organization: ['getUser', 'manageUsers', 'addEmployee', 'getAttendence'],
  admin: ['getUsers', 'manageUsers'],
  employee: ['getAttendence', 'manageUsers'],
};

export enum DevelopmentOptions {
  development = 'development',
  production = 'production',
}

export const roles: string[] = Object.keys(allRoles);
export const roleRights: Map<string, string[]> = new Map(Object.entries(allRoles));
