import config from "../config/env.js";
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

const renderTemplate = ({
  heading,
  intro,
  buttonLabel,
  url,
  note,
}) => `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0f766e;">Equb Platform</p>
                <h1 style="margin:0 0 12px;font-size:20px;">${escapeHtml(heading)}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
                <p style="margin:0 0 24px;">
                  <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">${escapeHtml(buttonLabel)}</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#475569;">If the button does not work, copy this link into your browser:</p>
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

export const sendVerificationEmail = ({ user, token }) => {
  const url = `${getAppUrl()}/verify-email?token=${token}`;
  const intro = `Hello ${user.fullName}, confirm your email address to finish setting up your Equb Platform account.`;
  const note =
    "This link expires in 24 hours. If you did not create an account, you can ignore this email.";

  return sendEmail({
    to: user.email,
    toName: user.fullName,
    subject: "Confirm your email address",
    html: renderTemplate({
      heading: "Confirm your email",
      intro,
      buttonLabel: "Confirm email",
      url,
      note,
    }),
    text: `${intro}\n\n${url}\n\n${note}`,
    devLink: url,
  });
};

export const sendPasswordResetEmail = ({ user, token }) => {
  const url = `${getAppUrl()}/reset-password?token=${token}`;
  const intro = `Hello ${user.fullName}, we received a request to reset your Equb Platform password.`;
  const note =
    "This link expires in 15 minutes. If you did not request a reset, you can ignore this email and your password will stay the same.";

  return sendEmail({
    to: user.email,
    toName: user.fullName,
    subject: "Reset your password",
    html: renderTemplate({
      heading: "Reset your password",
      intro,
      buttonLabel: "Choose a new password",
      url,
      note,
    }),
    text: `${intro}\n\n${url}\n\n${note}`,
    devLink: url,
  });
};
