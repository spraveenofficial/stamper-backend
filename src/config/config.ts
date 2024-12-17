import Joi from 'joi';
import 'dotenv/config';

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    CLIENT_URL: Joi.string().required().description('Client url'),
    RESEND_KEY: Joi.string().required().description('Resend key'),
    AWS_S3_ACCESS_KEY: Joi.string().required().description('AWS S3 access key'),
    AWS_S3_KEY_SECRET: Joi.string().required().description('AWS S3 secret key'),
    AWS_S3_PUBLIC_BUCKET: Joi.string().required().description('AWS S3 public bucket name'),
    REDIS_URL: Joi.string().description('Redis URL'),
    CLOUDFRONT_DOMAIN: Joi.string().required().description('Cloudfront domain'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    inviteExpirationInDays: envVars.JWT_INVITE_EXPIRATION_DAYS,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      signed: true,
    },
  },
  email: {
    from: envVars.EMAIL_FROM,
  },
  resendKey: envVars.RESEND_KEY,
  clientUrl: envVars.CLIENT_URL,
  AWS_S3_ACCESS_KEY: envVars.AWS_S3_ACCESS_KEY,
  AWS_S3_KEY_SECRET: envVars.AWS_S3_KEY_SECRET,
  AWS_S3_PUBLIC_BUCKET: envVars.AWS_S3_PUBLIC_BUCKET,
  REDIS_URL: envVars.REDIS_URL,
  CLOUDFRONT_DOMAIN: envVars.CLOUDFRONT_DOMAIN,
};

export default config;
