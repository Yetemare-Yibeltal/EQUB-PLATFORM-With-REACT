import config from "./env.js";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const apiPublicUrl = trimTrailingSlash(config.apiPublicUrl);
const clientUrl = trimTrailingSlash(
  config.clientOrigins[0] ?? "http://localhost:5173",
);

const paymentConfig = Object.freeze({
  currency: "ETB",
  checkoutWindowMs: 30 * 60 * 1000,
  chapa: Object.freeze({
    enabled: Boolean(config.chapa.secretKey),
    baseUrl: trimTrailingSlash(config.chapa.baseUrl),
    secretKey: config.chapa.secretKey,
    webhookSecret: config.chapa.webhookSecret,
    timeoutMs: 15000,
    callbackUrl: apiPublicUrl ? `${apiPublicUrl}/api/payments/callback` : "",
    returnUrl: `${clientUrl}/payments/result`,
  }),
});

export default paymentConfig;
