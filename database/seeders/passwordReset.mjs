import { connectDB, disconnectDB } from "../../backend/src/config/db.js";
import User from "../../backend/src/models/User.js";
import { hashPassword } from "../../backend/src/utils/password.js";
import { normalizePhone } from "../../backend/src/utils/phone.js";

const run = async () => {
  const phone = normalizePhone(process.env.RESET_PHONE || "");
  const password = process.env.RESET_PASSWORD || "";

  if (!phone) {
    throw new Error("RESET_PHONE must be a valid Ethiopian mobile number");
  }

  if (
    password.length < 8 ||
    password.length > 72 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      "RESET_PASSWORD must be 8 to 72 characters with at least one letter and one number",
    );
  }

  await connectDB();

  const passwordHash = await hashPassword(password);
  const result = await User.updateOne(
    { phone },
    {
      $set: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
        refreshTokens: [],
      },
    },
  );

  if (result.matchedCount === 0) {
    throw new Error("No account uses this phone number");
  }

  console.log(`Password reset for ${phone}`);
};

let exitCode = 0;

try {
  await run();
} catch (error) {
  console.error(`Password reset failed: ${error.message}`);
  exitCode = 1;
} finally {
  await disconnectDB();
  process.exit(exitCode);
}
