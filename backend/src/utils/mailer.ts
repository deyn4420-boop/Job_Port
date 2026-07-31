import nodemailer, { Transporter } from "nodemailer";

// Mirrors the ANTHROPIC_API_KEY pattern used for match scoring: if SMTP isn't
// configured, emails are silently skipped instead of breaking the app.
let transporter: Transporter | null = null;
let initialized = false;

function getTransporter(): Transporter | null {
  if (initialized) return transporter;
  initialized = true;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP not configured - email notifications will be skipped.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

// Fire-and-forget: callers should not await this on the request's critical
// path. Failures are logged, never thrown, so a broken mail server never
// takes down an application/job update.
export async function sendEmail({ to, subject, text }: SendEmailInput): Promise<void> {
  const client = getTransporter();
  if (!client) return;

  try {
    await client.sendMail({
      from: process.env.EMAIL_FROM || "Job Portal <no-reply@jobportal.local>",
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
}
