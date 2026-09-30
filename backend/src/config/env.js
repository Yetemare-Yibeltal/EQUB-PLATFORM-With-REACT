import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const optionalString = Joi.string().allow("").default("");

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(5000),
  CLIENT_URL: Joi.string().default("http://localhost:5173"),

  MONGODB_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),

  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().integer().positive().default(300),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().positive().default(10),

  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "http", "debug")
    .default("info"),

  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,

  CHAPA_BASE_URL: Joi.string().uri().default("https://api.chapa.co/v1"),
  CHAPA_SECRET_KEY: optionalString,
  CHAPA_WEBHOOK_SECRET: optionalString,
});

const { value, error } = schema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  const problems = error.details.map((detail) => detail.message).join("; ");
  throw new Error(`Invalid environment configuration: ${problems}`);
}

const isProduction = value.NODE_ENV === "production";

if (isProduction) {
  const insecure = [value.JWT_ACCESS_SECRET, value.JWT_REFRESH_SECRET].some(
    (secret) => secret.toLowerCase().includes("change-me"),
  );
  if (insecure) {
    throw new Error(
      "Invalid environment configuration: JWT secrets must not use template values in production",
    );
  }
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
    throw new Error(
      "Invalid environment configuration: JWT access and refresh secrets must differ",
    );
  }
}

const config = Object.freeze({
  env: value.NODE_ENV,
  isProduction,
  isTest: value.NODE_ENV === "test",
  isDevelopment: value.NODE_ENV === "development",
  port: value.PORT,
  clientOrigins: value.CLIENT_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongo: Object.freeze({
    uri: value.MONGODB_URI,
  }),
  jwt: Object.freeze({
    accessSecret: value.JWT_ACCESS_SECRET,
    accessExpiresIn: value.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: value.JWT_REFRESH_SECRET,
    refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
  }),
  security: Object.freeze({
    bcryptSaltRounds: value.BCRYPT_SALT_ROUNDS,
    rateLimit: Object.freeze({
      windowMs: value.RATE_LIMIT_WINDOW_MS,
      max: value.RATE_LIMIT_MAX,
      authMax: value.AUTH_RATE_LIMIT_MAX,
    }),
  }),
  log: Object.freeze({
    level: value.LOG_LEVEL,
  }),
  cloudinary: Object.freeze({
    cloudName: value.CLOUDINARY_CLOUD_NAME,
    apiKey: value.CLOUDINARY_API_KEY,
    apiSecret: value.CLOUDINARY_API_SECRET,
  }),
  chapa: Object.freeze({
    baseUrl: value.CHAPA_BASE_URL,
    secretKey: value.CHAPA_SECRET_KEY,
    webhookSecret: value.CHAPA_WEBHOOK_SECRET,
  }),
});

export default config;
