const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error(
      "Missing MONGO_URI in environment variables. Check your .env file.",
    );
    process.exit(1);
  }

  try {
    // Fail fast on a bad connection string instead of hanging indefinitely
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

mongoose.connection.on("error", (err) =>
  console.error("MongoDB runtime error:", err.message),
);
mongoose.connection.on("disconnected", () =>
  console.warn("MongoDB disconnected. Attempting to reconnect..."),
);
mongoose.connection.on("reconnected", () =>
  console.log("MongoDB reconnected."),
);

async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error while closing MongoDB connection:", err.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = connectDB;
