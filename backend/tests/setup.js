process.env.NODE_ENV = "test";
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI ||
  "mongodb://127.0.0.1:27017/equb_test?directConnection=true";
process.env.JWT_ACCESS_SECRET =
  "test-access-secret-with-at-least-32-characters";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-with-at-least-32-characters";
process.env.BCRYPT_SALT_ROUNDS = "10";
process.env.CHAPA_SECRET_KEY = "test-chapa-secret-key";
process.env.CHAPA_BASE_URL = "https://chapa.test/v1";
process.env.CHAPA_WEBHOOK_SECRET = "whsec_test";
