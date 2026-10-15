import http from "node:http";
import app from "./app.js";
import config from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { closeSocketServer, createSocketServer } from "./config/socket.js";
import { startScheduler, stopScheduler } from "./jobs/scheduler.js";
import { registerSocketHandlers } from "./sockets/index.js";
import logger from "./utils/logger.js";

const SHUTDOWN_TIMEOUT_MS = 10000;

const server = http.createServer(app);

let shuttingDown = false;

const closeHttpServer = () =>
  new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve();
      return;
    }

    server.close((error) => (error ? reject(error) : resolve()));
    server.closeIdleConnections?.();
  });

const shutdown = async (reason, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Shutting down: ${reason}`);

  const forceExit = setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    stopScheduler();
    await closeSocketServer();
    await closeHttpServer();
    await disconnectDB();
    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (error) {
    logger.error(`Shutdown failed: ${error.message}`);
    process.exit(1);
  }
};

const start = async () => {
  try {
    await connectDB();

    registerSocketHandlers(createSocketServer(server));

    server.listen(config.port, () => {
      logger.info(
        `Server listening on port ${config.port} in ${config.env} mode`,
      );

      if (!config.isTest) {
        startScheduler();
      }
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error(
    `Unhandled rejection: ${reason instanceof Error ? reason.stack : reason}`,
  );
  shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error.stack}`);
  shutdown("uncaughtException", 1);
});

start();

export default server;
