import nodemailer from 'nodemailer';

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM are required');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return { transporter, from };
}

export async function sendVerificationCode({ to, code }) {
  const { transporter, from } = getMailer();
  await transporter.sendMail({
    from,
    to,
    subject: 'Your Home Financial verification code',
    text: `Your verification code is ${code}. It expires in 15 minutes.`,
  });
}
