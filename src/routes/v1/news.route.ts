import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { newsController, newsValidation } from '../../modules/news';

const router: Router = express.Router();

router.route('/create').post(auth('createNews'), validate(newsValidation.createNewNewsBody), newsController.createNews);
router.route('/latest').get(auth(), newsController.getLatestNews);
router.route('/:id').get(auth(), validate(newsValidation.getNewsByIdParams), newsController.getNewsById);
router.route('/:id').delete(auth('deleteNews'), validate(newsValidation.getNewsByIdParams), newsController.deleteNewsById);
router.route('/update/:id').put(auth('updateNews'), validate(newsValidation.updateNewsByIdParams), newsController.updateNewsById);

export default router;
