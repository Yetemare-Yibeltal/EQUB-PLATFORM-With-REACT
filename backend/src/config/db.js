import mongoose from "mongoose";
import config from "./env.js";
import logger from "../utils/logger.js";

const MAX_CONNECTION_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

const connectionOptions = {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

mongoose.set("strictQuery", true);

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

mongoose.connection.on("error", (error) => {
  logger.error(`MongoDB connection error: ${error.message}`);
});

export const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_CONNECTION_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(config.mongo.uri, connectionOptions);
      logger.info(
        `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
      );
      return mongoose.connection;
    } catch (error) {
      logger.error(
        `MongoDB connection attempt ${attempt}/${MAX_CONNECTION_ATTEMPTS} failed: ${error.message}`,
      );
      if (attempt === MAX_CONNECTION_ATTEMPTS) {
        throw error;
      }
      await wait(RETRY_DELAY_MS);
    }
  }
  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("MongoDB connection closed");
  }
};

export default connectDB;
