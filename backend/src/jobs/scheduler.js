import cron from "node-cron";
import logger from "../utils/logger.js";
import contributionReminderJob from "./contributionReminder.job.js";
import drawReminderJob from "./drawReminder.job.js";
import notificationJob from "./notification.job.js";
import payoutReminderJob from "./payoutReminder.job.js";

const TIMEZONE = "Africa/Addis_Ababa";

const jobs = [
  contributionReminderJob,
  drawReminderJob,
  payoutReminderJob,
  notificationJob,
];

const running = new Set();

let tasks = [];

export const jobNames = () => jobs.map((job) => job.name);

const execute = async (job) => {
  if (running.has(job.name)) {
    logger.warn(
      `Job ${job.name} skipped because the previous run is still active`,
    );
    return;
  }

  running.add(job.name);
  const startedAt = Date.now();

  try {
    const summary = await job.run(new Date());
    logger.info(
      `Job ${job.name} finished in ${Date.now() - startedAt}ms ${JSON.stringify(summary ?? {})}`,
    );
  } catch (error) {
    logger.error(`Job ${job.name} failed: ${error.message}`, {
      stack: error.stack,
    });
  } finally {
    running.delete(job.name);
  }
};

export const startScheduler = () => {
  if (tasks.length > 0) return;

  jobs.forEach((job) => {
    if (!cron.validate(job.schedule)) {
      throw new Error(`Invalid schedule for job ${job.name}: ${job.schedule}`);
    }
  });

  tasks = jobs.map((job) =>
    cron.schedule(job.schedule, () => execute(job), { timezone: TIMEZONE }),
  );

  logger.info(`Scheduler started with ${tasks.length} jobs`);
};

export const stopScheduler = () => {
  tasks.forEach((task) => task.stop());
  tasks = [];
};

export const runJobNow = async (name) => {
  const job = jobs.find((entry) => entry.name === name);

  if (!job) {
    throw new Error(`Unknown job: ${name}`);
  }

  return job.run(new Date());
};
