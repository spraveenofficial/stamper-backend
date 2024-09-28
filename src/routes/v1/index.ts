import express, { Router } from 'express';
import authRoute from './auth.route';
import docsRoute from './swagger.route';
import userRoute from './user.route';
import organizationRoute from './organization.route';
import leaveRoute from './leave.route';
import notificationRoute from './notification.route';
import employeeRoute from './employee.route';
import officeRoute from './office.route';
import departmentRoute from './department.route';
import jobTitlesRoute from './jobTitles.route';
import documentsRoute from './documents.route';
import config from '../../config/config';

const router: Router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/organizations',
    route: organizationRoute,
  },
  {
    path: '/leave',
    route: leaveRoute,
  },
  {
    path: '/notification',
    route: notificationRoute,
  },
  {
    path: '/employee',
    route: employeeRoute,
  },
  {
    path: '/office',
    route: officeRoute,
  },
  {
    path: '/department',
    route: departmentRoute,
  },
  {
    path: '/job-titles',
    route: jobTitlesRoute,
  },
  {
    path: '/documents',
    route: documentsRoute,
  }
];

const devIRoute: IRoute[] = [
  // IRoute available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
