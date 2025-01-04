import express, { Router } from 'express';
import { auth } from '../../modules/auth';
// import { validate } from '../../modules/validate';
import { chatController } from '../../modules/chatv2';

const router: Router = express.Router();

router.route('/create').post(auth('sendMessage'), chatController.sendMessage);

router.route('/messages').get(auth(), chatController.getMyMessage);

// Group Chat routes

router.route('/group/create').post(auth(), chatController.createGroupChat);

router.route('/message').get(auth(), chatController.getMessageByChatId);

export default router;
