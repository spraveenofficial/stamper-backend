import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { jobTitleController, jobTitleValidation } from '../../modules/jobTitles';

const router: Router = express.Router();


router
  .route('/')
  .get(auth('getJobTitles'), jobTitleController.getJobTitles);
router
  .route('/add')
  .post(auth('addJobTitle'), validate(jobTitleValidation.createJobTitleRequest), jobTitleController.addJobTitle);

export default router;
