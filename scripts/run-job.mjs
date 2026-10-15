import { connectDB, disconnectDB } from "../backend/src/config/db.js";
import { jobNames, runJobNow } from "../backend/src/jobs/scheduler.js";

const name = process.argv[2];
const names = jobNames();

if (!name || !names.includes(name)) {
  console.error(`Usage: run-job <${names.join("|")}>`);
  process.exit(1);
}

let exitCode = 0;

try {
  await connectDB();
  const summary = await runJobNow(name);
  console.log(JSON.stringify(summary ?? {}));
} catch (error) {
  console.error(`Job failed: ${error.message}`);
  exitCode = 1;
} finally {
  await disconnectDB();
  process.exit(exitCode);
}
