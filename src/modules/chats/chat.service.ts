import mongoose from 'mongoose';
import { IMessageDoc, NewMessageType } from './chat.interfaces';
import Message from './chat.model'


export const createMessage = async(
   messageBody:NewMessageType,
   from:mongoose.Types.ObjectId,
   to:mongoose.Types.ObjectId,

):Promise<IMessageDoc>=>{
    return await Message.create({
         ...messageBody,
         from,
         to
    })
}

export const getAllMessagesByUserId = async(
    userId:mongoose.Types.ObjectId,
    
):Promise<IMessageDoc[] |null>=>{
    const messages = await Message.find({
        to: new mongoose.Types.ObjectId(userId)
    }).populate('from to').select('seen').exec()
    return messages
}