import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { newsController, newsValidation } from '../../modules/news';

const router: Router = express.Router();

router.route('/create').post(auth('createNews'), validate(newsValidation.createNewNewsBody), newsController.createNews);
router.route('/latest').get(auth(), newsController.getLatestNews);
export default router;
