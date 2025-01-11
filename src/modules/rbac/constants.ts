import { rolesEnum } from '../../config/roles';
// import { initializeUserPermissions } from './prepopulat';

type PermissionMapping = Record<rolesEnum, string[]>;

export const defaultPermissions: PermissionMapping = {
  [rolesEnum.organization]: [
    'department.create',
    'department.read',
    'department.update',
    'department.delete',
    'jobtitle.create',
    'jobtitle.read',
    'jobtitle.update',
    'office.create',
    'office.read',
    'office.update',
    'office.delete',
    'employee.create',
    'employee.read',
    'employee.update',
    'employee.delete',
    'news.create',
    'news.read',
    'news.update',
    'news.delete',
    'document.create',
    'document.read',
    'document.update',
    'document.delete',
  ],
  [rolesEnum.admin]: [
    'department.read',
    'department.update',
    'employee.read',
    'employee.update',
    'attendance.read',
    'attendance.update',
    'leave.read',
    'leave.update',
    'report.read',
    'news.create',
    'news.read',
    'news.update',
    'news.delete',
  ],
  [rolesEnum.moderator]: [
    'attendance.read',
    'attendance.update',
    'leave.create',
    'leave.read',
    'leave.update',
    'office.read',
    'jobtitle.create',
    'jobtitle.read',
    'jobtitle.update',
    'department.read',
    'document.create',
    'document.read',
    'document.update',
    'news.create',
    'news.read',
    'news.update',
    'news.delete',
    'document.create',
    'document.read',
    'document.update',
  ],
  [rolesEnum.employee]: [
    'profile.read',
    'profile.update',
    'office.read',
    'jobtitle.read',
    'department.read',
    'attendance.read',
    'leave.create',
    'leave.read',
    'document.read',
    'news.read',
    'document.create',
    'document.read',
  ],
};

// (async () => {
//   setTimeout(async () => {
//     await initializeUserPermissions();
//   }, 1000);
// })();
