const cron = require('node-cron');
const nodemailer = require('nodemailer');
const prisma = require('../config/db');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendReminders() {
  if (!process.env.SMTP_USER) return; // skip if email not configured

  const today = new Date();
  const in14  = new Date(today.getTime() + 14 * 86400000);
  const yesterday = new Date(today.getTime() - 86400000);

  const drivers = await prisma.driver.findMany({
    where: {
      licenseExpiry: { gte: today, lte: in14 },
      OR: [
        { lastReminderAt: null },
        { lastReminderAt: { lt: yesterday } }, // don't spam more than once per day
      ],
    },
  });

  if (drivers.length === 0) return;

  // Send digest to Safety Officer(s)
  const safetyOfficers = await prisma.user.findMany({
    where: { role: 'SafetyOfficer' },
    select: { email: true },
  });

  const driverList = drivers
    .map(d => `• ${d.name} (${d.licenseNumber}) — expires ${d.licenseExpiry.toDateString()}`)
    .join('\n');

  const recipients = safetyOfficers.map(u => u.email).join(', ');
  if (!recipients) return;

  await transporter.sendMail({
    from:    process.env.MAIL_FROM || 'TransitOps <no-reply@transitops.io>',
    to:      recipients,
    subject: `[TransitOps] ${drivers.length} driver license(s) expiring within 14 days`,
    text:    `The following drivers have licenses expiring soon:\n\n${driverList}\n\nPlease take action.`,
  });

  // Mark reminder sent
  await prisma.driver.updateMany({
    where: { id: { in: drivers.map(d => d.id) } },
    data:  { lastReminderAt: new Date() },
  });

  console.log(`[LicenseReminder] Sent digest for ${drivers.length} driver(s) to ${recipients}`);
}

// Run every day at 06:00
cron.schedule('0 6 * * *', () => {
  sendReminders().catch(err => console.error('[LicenseReminder] Error:', err));
});

module.exports = { sendReminders }; // exported for manual testing
