import { userCapInterfaces } from '@/modules/common/userCap';
import { rolesEnum } from '../config/roles';
import { plansInterfaces } from '../modules/common/plans';

// Define the structure for cap limits
interface ICapLimitsType {
  ADD_OFFICE: number;
  ADD_DEPARTMENT: number;
  ADD_JOB_TITLE: number;
  ADD_EMPLOYEE: number;
  ADD_MANAGER: number;
  ADD_FOLDER: number;
  ADD_DOCUMENT: number;
}

const MAX_CAP_LIMITS: Record<plansInterfaces.SubscriptionPlanEnum, ICapLimitsType> = {
  [plansInterfaces.SubscriptionPlanEnum.FREE]: {
    ADD_OFFICE: 1,
    ADD_DEPARTMENT: 5,
    ADD_JOB_TITLE: 10,
    ADD_EMPLOYEE: 10,
    ADD_MANAGER: 1,
    ADD_FOLDER: 10,
    ADD_DOCUMENT: 10,
  },
  [plansInterfaces.SubscriptionPlanEnum.BASIC]: {
    ADD_OFFICE: 3,
    ADD_DEPARTMENT: 5,
    ADD_JOB_TITLE: 100,
    ADD_EMPLOYEE: 50,
    ADD_MANAGER: 10,
    ADD_FOLDER: 20,
    ADD_DOCUMENT: 50,
  },
  [plansInterfaces.SubscriptionPlanEnum.PRO]: {
    ADD_OFFICE: 10,
    ADD_DEPARTMENT: 10,
    ADD_JOB_TITLE: 100,
    ADD_EMPLOYEE: 100,
    ADD_MANAGER: 50,
    ADD_FOLDER: 50,
    ADD_DOCUMENT: 100,
  },
};

const ROLE_LIMITS: Record<rolesEnum, (keyof ICapLimitsType)[]> = {
  organization: [
    'ADD_OFFICE',
    'ADD_DEPARTMENT',
    'ADD_JOB_TITLE',
    'ADD_EMPLOYEE',
    'ADD_MANAGER',
    'ADD_FOLDER',
    'ADD_DOCUMENT',
  ],
  admin: [],
  employee: ['ADD_FOLDER', 'ADD_DOCUMENT'],
  moderator: [],
};

// Mapping between snake_case keys and camelCase keys
const CAP_LIMITS_MAPPING: Record<keyof ICapLimitsType, keyof userCapInterfaces.ICapLimitsDoc> = {
  ADD_OFFICE: 'addOffice',
  ADD_DEPARTMENT: 'addDepartment',
  ADD_JOB_TITLE: 'addJobTitle',
  ADD_EMPLOYEE: 'addEmployee',
  ADD_MANAGER: 'addManager',
  ADD_FOLDER: 'addFolder',
  ADD_DOCUMENT: 'addDocument',
};

export { CAP_LIMITS_MAPPING, MAX_CAP_LIMITS, ROLE_LIMITS };

