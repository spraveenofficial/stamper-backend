import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { jobTitleController, jobTitleValidation } from '../../modules/jobTitles';
import { organizationMiddleware } from '../../modules/organization';
import { rbacMiddleware } from '../../modules/rbac';
import { validate } from '../../modules/validate';

const router: Router = express.Router();

router.route('/').get(auth(), rbacMiddleware.checkPermission('jobtitle.read'), organizationMiddleware.organizationMiddleware, jobTitleController.getJobTitles);

router
  .route('/add')
  .post(
    auth(),
    rbacMiddleware.checkPermission('jobtitle.create'),
    validate(jobTitleValidation.createJobTitleRequest),
    organizationMiddleware.organizationMiddleware,
    jobTitleController.addJobTitle
  );

router
  .route('/edit')
  .put(auth('editJobTitle'),
    rbacMiddleware.checkPermission('jobtitle.update'),
    validate(jobTitleValidation.updateJobTitleRequest), jobTitleController.editJobTitle);
export default router;
