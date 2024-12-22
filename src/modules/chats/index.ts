import * as chatServices from './chat.service';
import * as chatInterfaces from './chat.interfaces';
import Message from './chat.model';
import * as chatController from './chat.controller';
import * as chatValidations from './chat.validation';

// Group Chat imports
import * as groupChatServices from './group-chat.service';
import * as groupChatInterfaces from './group-chat.interfaces';
import * as groupChatController from './group-chat.controller';
import { Group, ParticipantLog } from './group-chat.model';

export { chatInterfaces, chatServices, Message, chatController, chatValidations };

export { groupChatController, groupChatInterfaces, groupChatServices, Group, ParticipantLog };
