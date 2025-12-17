/* eslint-disable @typescript-eslint/no-explicit-any */
import winston from "winston";

const customFormat = winston.format.printf(
  ({level, message, timestamp, requestId}) => {
    const reqId = requestId ? `[${requestId}]` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${reqId} ${message}`;
  }
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({format: "YYYY/MM/DD HH:mm:ss.SSS"}),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({format: "YYYY/MM/DD HH:mm:ss.SSS"}),
        customFormat
      ),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Helper functions for request logging dengan format yang diminta user
export const logRequestStart = (
  requestId: string,
  method: string,
  url: string
) => {
  logger.info(`====== ${method} ${url} ======`, {requestId});
};

export const logRequestEnd = (
  requestId: string,
  method: string,
  url: string,
  statusCode: number,
  duration: number
) => {
  logger.info(`Response: ${statusCode} (${duration}ms)`, {requestId});
};

export const logError = (requestId: string, error: any) => {
  logger.error(`Error: ${error.message || error}`, {requestId});
  if (error.stack && process.env.NODE_ENV === "development") {
    logger.error(error.stack, {requestId});
  }
};
