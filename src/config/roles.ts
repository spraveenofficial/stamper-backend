const allRoles = {
  organization: ['profile', 'addEmployee', 'addOrganization'],
  admin: ['profile'],
  employee: ['profile'],
};

export enum DevelopmentOptions {
  development = 'development',
  production = 'production',
}

export const roles: string[] = Object.keys(allRoles);
export const roleRights: Map<string, string[]> = new Map(Object.entries(allRoles));
