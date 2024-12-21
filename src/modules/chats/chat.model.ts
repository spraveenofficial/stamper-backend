import mongoose from 'mongoose';
import { toJSON } from '../toJSON';
import { IMessageDoc, IMessageModel, MessageType } from './chat.interfaces';


const messageSchema = new mongoose.Schema<IMessageDoc, IMessageModel>(

    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            enum: MessageType,
            required:false,
            default:MessageType.TEXT
        },
        content:
        {
            type:String,
            required:true
        },
        seen:{
         type:Boolean,
         required:false,
         default:false
        },
        seenAt:{
            type:Date,
            required:false,
            default:null,
        },
        reaction:{
            type:String,
            required:false,
            default:null,
        },
        deletedAt:{
            type:Date,
            required:false,
            default:null,
        }

    },
    {
        timestamps:true
    }
);

messageSchema.plugin(toJSON)
const Message = mongoose.model<IMessageDoc, IMessageModel>('Messeges', messageSchema);

export default Message