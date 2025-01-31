import mongoose from 'mongoose';
import config from '../../config/config';
import { logger } from '../logger';



const ensureDBConnection = async () => {
    try {
        mongoose.connect(config.mongoose.url).then(() => {
            logger.info('Connected to MongoDB');
        })

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

export { ensureDBConnection };
