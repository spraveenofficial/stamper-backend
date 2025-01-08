import express, { Router } from 'express';
import attendanceRoute from './attendance.route';
import authRoute from './auth.route';
import chatRoute from './chat.route';
import departmentRoute from './department.route';
import documentsRoute from './documents.route';
import employeeRoute from './employee.route';
import eventRoute from './events.route';
import jobTitlesRoute from './jobTitles.route';
import leaveRoute from './leave.route';
import newsRoute from './news.route';
import notificationRoute from './notification.route';
import officeRoute from './office.route';
import organizationRoute from './organization.route';
import plansRoute from './plans.route';
import docsRoute from './swagger.route';
import userRoute from './user.route';
import paymentsRoute from './payments.route';

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
  },
  {
    path: '/news',
    route: newsRoute,
  },
  {
    path: '/attendance',
    route: attendanceRoute,
  },
  {
    path: '/event',
    route: eventRoute,
  },
  {
    path: '/chat',
    route: chatRoute,
  },
  {
    path: '/plans',
    route: plansRoute,
  },
  {
    path: '/payments',
    route: paymentsRoute,
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
