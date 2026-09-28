import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

async function testEmailSending() {
  const targetEmail = process.argv[2] || process.env.SMTP_USER;

  console.log('\n==================================================');
  console.log('--- DIAGNOSTIC SMTP EMAIL DELIVERY TEST ---');
  console.log('==================================================');

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim() || smtpUser;

  console.log(`SMTP_HOST: ${smtpHost || 'MISSING'}`);
  console.log(`SMTP_PORT: ${smtpPort}`);
  console.log(`SMTP_USER: ${smtpUser || 'MISSING'}`);
  console.log(`SMTP_PASS: ${smtpPass ? '[PRESENT]' : 'MISSING'}`);
  console.log(`EMAIL_FROM: ${emailFrom}`);
  console.log(`Target Recipient: ${targetEmail}\n`);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('❌ ERROR: Missing required SMTP configuration in .env');
    process.exit(1);
  }

  const isSecure = smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  console.log('Testing SMTP connection & authentication (transporter.verify())...');

  try {
    await transporter.verify();
    console.log('✅ SMTP connection and authentication succeeded!');
  } catch (verifyErr: any) {
    console.error('❌ SMTP Connection/Auth verification failed:');
    console.error('   Code:', verifyErr.code);
    console.error('   Response:', verifyErr.response);
    console.error('   Message:', verifyErr.message);
    process.exit(1);
  }

  console.log(`\nSending test email to ${targetEmail}...`);

  try {
    const info = await transporter.sendMail({
      from: emailFrom.includes('<') ? emailFrom : `System Window <${emailFrom}>`,
      to: targetEmail,
      subject: '[TEST] System Window Email Delivery Check',
      text: 'This is a test email to verify that SMTP email delivery is working properly.',
      html: '<b>This is a test email to verify that SMTP email delivery is working properly.</b>',
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('==================================================\n');
  } catch (sendErr: any) {
    console.error('❌ Failed to send test email:');
    console.error('   Code:', sendErr.code);
    console.error('   Response:', sendErr.response);
    console.error('   Message:', sendErr.message);
    console.error('==================================================\n');
    process.exit(1);
  }
}

testEmailSending();
