import winston, { Logform, Logger } from "winston";

const { format, transports } = winston;

import config from "../../config/config";

const enumerateErrorFormat = format((info: Logform.TransformableInfo) => {
  if (info instanceof Error) {
    return { ...info, message: info.stack || info.message || "Unknown Error" };
  }
  return info;
});

// Logger configuration
const logger: Logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: format.combine(
    enumerateErrorFormat(),
    config.env === "development" ? format.colorize() : format.uncolorize(),
    format.splat(),
    format.printf((info: Logform.TransformableInfo) => {
      const message = typeof info.message === "string" ? info.message : "Unknown message";
      return `${info.level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console({
      stderrLevels: ["error"], // Directs error-level logs to stderr
    }),
  ],
});

export default logger;
