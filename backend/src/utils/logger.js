import fs from "node:fs";
import path from "node:path";
import winston from "winston";
import config from "../config/env.js";

const logDirectory = path.resolve(process.cwd(), "logs");

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
);

const consoleFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const details = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${stack || message}${details}`;
  }),
);

const fileFormat = winston.format.combine(baseFormat, winston.format.json());

const transports = [new winston.transports.Console({ format: consoleFormat })];

if (!config.isTest) {
  fs.mkdirSync(logDirectory, { recursive: true });
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, "combined.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  );
}

const logger = winston.createLogger({
  level: config.log.level,
  silent: config.isTest,
  transports,
  exitOnError: false,
});

export default logger;
