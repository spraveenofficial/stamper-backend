import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { documentController, documentValidations } from '../../modules/documents';
import { organizationMiddleware } from '../../modules/organization';
import { validate } from '../../modules/validate';

const router: Router = express.Router();

router
  .route('/create-folder/:userId')
  .post(auth('createDocumentFolder'), validate(documentValidations.createNewFolderRequest), documentController.createFolder);

router.route("/get-employee-email").post(auth(), documentController.getEmployee);

router
  .route('/folders')
  .get(auth(), organizationMiddleware.organizationMiddlewareV2, documentController.getFolders);


export default router;
