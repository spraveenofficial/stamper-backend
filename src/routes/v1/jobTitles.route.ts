import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { jobTitleController, jobTitleValidation } from '../../modules/jobTitles';
import { organizationMiddleware } from '../../modules/organization';

const router: Router = express.Router();


router
  .route('/')
  .get(auth('getJobTitles'), organizationMiddleware.organizationMiddleware, jobTitleController.getJobTitles);
router
  .route('/add')
  .post(auth('addJobTitle'), validate(jobTitleValidation.createJobTitleRequest), jobTitleController.addJobTitle);

router
  .route('/edit')
  .put(auth('editJobTitle'), validate(jobTitleValidation.updateJobTitleRequest), jobTitleController.editJobTitle);
export default router;
