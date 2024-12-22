import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { validate } from '../../modules/validate';
import { chatController, chatValidations, groupChatController } from '../../modules/chats';

const router: Router = express.Router();

router
  .route('/create')
  .post(validate(chatValidations.createChatRequest), auth('sendMessage'), chatController.createUserMessage);

router.route('/messages').get(auth(), chatController.getMyMessage);

// Group Chat routes

router.route('/group/create').post(auth(), groupChatController.createNewGroup);

export default router;
