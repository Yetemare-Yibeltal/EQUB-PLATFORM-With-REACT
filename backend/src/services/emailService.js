import config from "../config/env.js";
import { resolveLanguage } from "../constants/languages.js";
import logger from "../utils/logger.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const REQUEST_TIMEOUT_MS = 10000;

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const isConfigured = () =>
  Boolean(config.email.apiKey && config.email.fromAddress);

const getAppUrl = () => (config.clientOrigins[0] || "").replace(/\/+$/, "");

const COPY = {
  en: {
    brand: "Kidane Mihret Equb Mahber",
    fallback: "If the button does not work, copy this link into your browser:",
    verification: {
      subject: "Confirm your email address",
      heading: "Confirm your email",
      intro: (name) =>
        `Hello ${name}, confirm your email address to finish setting up your Kidane Mihret Equb Mahber account.`,
      button: "Confirm email",
      note: "This link expires in 24 hours. If you did not create an account, you can ignore this email.",
    },
    reset: {
      subject: "Reset your password",
      heading: "Reset your password",
      intro: (name) =>
        `Hello ${name}, we received a request to reset your Kidane Mihret Equb Mahber password.`,
      button: "Choose a new password",
      note: "This link expires in 15 minutes. If you did not request a reset, you can ignore this email and your password will stay the same.",
    },
  },
  am: {
    brand: "ኪዳነ ምሕረት እቁብ ማኅበር",
    fallback: "አዝራሩ ካልሰራ ይህን አገናኝ ወደ አሳሽዎ ይቅዱ፦",
    verification: {
      subject: "የኢሜይል አድራሻዎን ያረጋግጡ",
      heading: "ኢሜይልዎን ያረጋግጡ",
      intro: (name) =>
        `ሰላም ${name}፣ የኪዳነ ምሕረት እቁብ ማኅበር መለያዎን ማዘጋጀት ለመጨረስ የኢሜይል አድራሻዎን ያረጋግጡ።`,
      button: "ኢሜይሉን አረጋግጥ",
      note: "ይህ አገናኝ በ24 ሰዓት ውስጥ ያበቃል። መለያ ካልፈጠሩ ይህን ኢሜይል ችላ ማለት ይችላሉ።",
    },
    reset: {
      subject: "የይለፍ ቃልዎን ይቀይሩ",
      heading: "የይለፍ ቃልዎን ያድሱ",
      intro: (name) =>
        `ሰላም ${name}፣ የኪዳነ ምሕረት እቁብ ማኅበር የይለፍ ቃልዎን ለመቀየር ጥያቄ ደርሶናል።`,
      button: "አዲስ የይለፍ ቃል ምረጥ",
      note: "ይህ አገናኝ በ15 ደቂቃ ውስጥ ያበቃል። ጥያቄውን ካላቀረቡ ይህን ኢሜይል ችላ ይበሉ፤ የይለፍ ቃልዎ አይለወጥም።",
    },
  },
};

const renderTemplate = ({
  language,
  brand,
  heading,
  intro,
  buttonLabel,
  fallback,
  url,
  note,
}) => `<!doctype html>
<html lang="${language}">
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:'Noto Sans Ethiopic',Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0f766e;">${escapeHtml(brand)}</p>
                <h1 style="margin:0 0 12px;font-size:20px;">${escapeHtml(heading)}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
                <p style="margin:0 0 24px;">
                  <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">${escapeHtml(buttonLabel)}</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#475569;">${escapeHtml(fallback)}</p>
                <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#0f766e;">${escapeHtml(url)}</p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">${escapeHtml(note)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const sendEmail = async ({
  to,
  toName,
  subject,
  html,
  text,
  devLink,
}) => {
  if (!isConfigured()) {
    if (config.isProduction) {
      logger.warn(`Email is not configured, skipped "${subject}"`);
    } else {
      logger.info(`Email is not configured, ${subject}: ${devLink}`);
    }
    return false;
  }

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.email.apiKey,
    },
    body: JSON.stringify({
      sender: { name: config.email.fromName, email: config.email.fromAddress },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`Email provider responded ${response.status}: ${detail}`);
  }

  return true;
};

const sendLinkEmail = ({ user, url, kind }) => {
  const language = resolveLanguage(user.language);
  const copy = COPY[language];
  const part = copy[kind];
  const intro = part.intro(user.fullName);

  return sendEmail({
    to: user.email,
    toName: user.fullName,
    subject: part.subject,
    html: renderTemplate({
      language,
      brand: copy.brand,
      heading: part.heading,
      intro,
      buttonLabel: part.button,
      fallback: copy.fallback,
      url,
      note: part.note,
    }),
    text: `${intro}\n\n${url}\n\n${part.note}`,
    devLink: url,
  });
};

export const sendVerificationEmail = ({ user, token }) =>
  sendLinkEmail({
    user,
    url: `${getAppUrl()}/verify-email?token=${token}`,
    kind: "verification",
  });

export const sendPasswordResetEmail = ({ user, token }) =>
  sendLinkEmail({
    user,
    url: `${getAppUrl()}/reset-password?token=${token}`,
    kind: "reset",
  });
