import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Request, Response, NextFunction } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const i18nConfig = {
  preload: ['en', 'fr', 'hi'],
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr', 'hi'],
  ns: ['messages'],
  saveMissing: true,
  debug: true,
  backend: {
    loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    jsonIndent: 2,
  },
  detection: {
    order: ['header'],
    lookupHeader: 'accept-language',
  },
};

// Async middleware for i18n initialization and handling
export const i18n = async (req: Request, res: Response, next: NextFunction) => {
  if (!i18next.isInitialized) {
    await i18next.use(Backend).use(i18nextMiddleware.LanguageDetector).init(i18nConfig);
  }
  // Use i18next middleware for Express
  i18nextMiddleware.handle(i18next)(req, res, next);
};
