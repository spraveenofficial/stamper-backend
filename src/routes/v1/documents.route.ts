import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { documentController, documentValidations } from '../../modules/documents';

const router: Router = express.Router();

router
  .route('/create-folder')
  .post(auth('createDocumentFolder'), validate(documentValidations.createNewFolderRequest), documentController.createFolder);

export default router;
