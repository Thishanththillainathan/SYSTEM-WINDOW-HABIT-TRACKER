import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

function getTransporter(): nodemailer.Transporter | null {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim()) || 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return null;
}

export async function verifySmtpConnection(): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('❌ [SMTP SERVICE ERROR] SMTP credentials missing in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).');
    return false;
  }
  try {
    await transporter.verify();
    console.log(`✅ [SMTP SERVICE] Connection & authentication verified successfully for ${process.env.SMTP_USER?.trim()}`);
    return true;
  } catch (err: any) {
    console.error('❌ [SMTP SERVICE VERIFY ERROR] SMTP login verification failed:');
    console.error(`   Code: ${err.code || 'N/A'}`);
    console.error(`   Response: ${err.response || 'N/A'}`);
    console.error(`   Message: ${err.message || String(err)}`);
    return false;
  }
}

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<SendEmailResult> {
  // ABSOLUTE RECIPIENT VALIDATION
  if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
    const invalidErr = 'Invalid recipient email address provided for OTP delivery.';
    console.error(`[EMAIL SERVICE ERROR] ${invalidErr}`);
    return { success: false, error: invalidErr };
  }

  const cleanEmail = toEmail.toLowerCase().trim();
  const fromEmail = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || 'noreply@systemwindow.app';
  const transporter = getTransporter();

  console.log(`Sending OTP email to ${cleanEmail}`);

  if (!transporter) {
    const errorMsg = 'SMTP email provider is not configured. Please specify SMTP_HOST, SMTP_USER, and SMTP_PASS in server environment.';
    console.error(`[EMAIL SERVICE ERROR] ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }

  const htmlBody = `
    <div style="background-color: #030712; color: #e2e8f0; font-family: sans-serif; padding: 30px; border-radius: 12px; border: 1px solid #00d4ff; max-width: 500px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #00d4ff; letter-spacing: 2px; font-size: 24px; margin: 0;">SYSTEM WINDOW</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 5px;">HUNTER VERIFICATION PROTOCOL</p>
      </div>
      <div style="background-color: #081426; border: 1px solid rgba(0, 212, 255, 0.4); padding: 20px; border-radius: 8px; text-align: center;">
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 15px;">Your 6-Digit System Awakening Passcode:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00d4ff; margin: 15px 0;">${otpCode}</div>
        <p style="color: #94a3b8; font-size: 11px;">This passcode expires in 10 minutes. Do not share this code.</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromEmail.includes('<') ? fromEmail : `System Window <${fromEmail}>`,
      to: cleanEmail,
      subject: `[SYSTEM WINDOW] Your 6-Digit Verification Code`,
      html: htmlBody,
    });

    console.log(`Email sent to ${cleanEmail} (Message ID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`Failed to send email to ${cleanEmail}: Code: ${err.code || 'N/A'}, Response: ${err.response || 'N/A'}, Message: ${err.message || String(err)}`);
    return {
      success: false,
      error: `Could not send verification email: ${err.message || 'SMTP transmission failure'}. Please try again.`,
    };
  }
}

export async function sendActivityEmail(userEmail: string, username: string, actionSummary: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'thishantht644@gmail.com';
  const fromEmail = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || 'noreply@systemwindow.app';
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[ACTIVITY LOG] No SMTP transporter configured. Skipped activity notification email for ${userEmail}.`);
    return false;
  }

  const htmlBody = `
    <div style="background-color: #0c0418; color: #ffffff; font-family: sans-serif; padding: 25px; border-radius: 10px; border: 1px solid rgba(168, 85, 247, 0.4); max-width: 500px; margin: 0 auto;">
      <h2 style="color: #a855f7; margin-top: 0;">USER ACTIVITY SUMMARY</h2>
      <p style="font-size: 14px;"><strong>Hunter:</strong> ${username} (${userEmail})</p>
      <p style="font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <div style="background-color: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
        <p style="margin: 0; font-size: 13px; color: #e2e8f0;">${actionSummary}</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail.includes('<') ? fromEmail : `System Window <${fromEmail}>`,
      to: adminEmail,
      subject: `[SYSTEM NOTICE] User Activity Summary: ${username}`,
      html: htmlBody,
    });
    return true;
  } catch (err: any) {
    console.error('❌ [ACTIVITY EMAIL ERROR] Failed to send activity summary:', err.message || err);
    return false;
  }
}

