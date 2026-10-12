import { connectDB, disconnectDB } from "../../backend/src/config/db.js";
import { USER_ROLES } from "../../backend/src/constants/roles.js";
import { USER_STATUSES } from "../../backend/src/constants/userStatuses.js";
import User from "../../backend/src/models/User.js";
import { hashPassword } from "../../backend/src/utils/password.js";
import { normalizePhone } from "../../backend/src/utils/phone.js";

const readConfiguration = () => {
  const fullName = (process.env.ADMIN_NAME || "Platform Administrator").trim();
  const phone = normalizePhone(process.env.ADMIN_PHONE || "");
  const password = process.env.ADMIN_PASSWORD || "";

  if (!phone) {
    throw new Error("ADMIN_PHONE must be a valid Ethiopian mobile number");
  }

  if (
    password.length < 8 ||
    password.length > 72 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      "ADMIN_PASSWORD must be 8 to 72 characters with at least one letter and one number",
    );
  }

  return { fullName, phone, password };
};

const run = async () => {
  const { fullName, phone, password } = readConfiguration();

  await connectDB();

  const existing = await User.findOne({ phone });

  if (existing) {
    existing.role = USER_ROLES.ADMIN;
    existing.status = USER_STATUSES.ACTIVE;
    await existing.save();
    console.log(`Existing user ${phone} promoted to administrator`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await User.create({
    fullName,
    phone,
    passwordHash,
    role: USER_ROLES.ADMIN,
    status: USER_STATUSES.ACTIVE,
    isPhoneVerified: true,
  });

  console.log(`Administrator ${phone} created`);
};

let exitCode = 0;

try {
  await run();
} catch (error) {
  console.error(`Admin seeding failed: ${error.message}`);
  exitCode = 1;
} finally {
  await disconnectDB();
  process.exit(exitCode);
}
