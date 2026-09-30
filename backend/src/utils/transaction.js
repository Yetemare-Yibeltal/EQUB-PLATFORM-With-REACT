import mongoose from "mongoose";

const defaultOptions = {
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
  readPreference: "primary",
};

export const withTransaction = async (work, options = {}) => {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(
      async () => {
        result = await work(session);
      },
      { ...defaultOptions, ...options },
    );
    return result;
  } finally {
    await session.endSession();
  }
};

export default withTransaction;
