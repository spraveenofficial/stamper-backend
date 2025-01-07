import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import httpStatus from 'http-status';
import xss from 'xss-clean';
import config from './config/config';
import { i18n } from './i18n/init';
import { ApiError, errorConverter, errorHandler } from './modules/errors';
import { morgan } from './modules/logger';
import { authLimiter } from './modules/utils';
import routes from './routes/v1';
// import { connectRedis } from './modules/redis/init';

const app: Express = express();

// Connect to Redis
// connectRedis();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Parse cookies
app.use(cookieParser());

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "https://stamper.tech"], // Allow the frontend origins
    credentials: true, // Allow credentials (cookies) to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these methods
  })
);

// Enable CORS preflight
app.options('*', cors());

// Parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize i18next middleware
app.use(i18n);

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data
app.use(xss());
app.use(ExpressMongoSanitize());

// Gzip compression
app.use(compression());

// Limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/api/v1/auth', authLimiter);
}

// v1 API routes
app.use('/api/v1', routes);

// Send back a 404 error for any unknown API request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

export default app;
