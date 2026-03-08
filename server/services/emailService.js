const { Resend } = require('resend');
const { config } = require('../config/redis');

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    const domain = process.env.EMAIL_DOMAIN || 'financetracker.space';
    this.fromOTP      = `Finance Tracker <no-reply@${domain}>`;
    this.fromReminder = `Reminders <reminder@${domain}>`;
    this.appName      = 'Finance Tracker';
    this.appUrl       = process.env.APP_URL || 'https://financetracker.space';
    this.accentColor  = '#2563EB';
  }

  sanitizeText(input) {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async sendOTPEmail(email, otp) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromOTP,
        to: email,
        subject: `${otp} is your Finance Tracker verification code`,
        html: this.generateOTPEmailTemplate(otp),
      });

      if (error) {
        console.error('Resend error sending OTP email:', error);
        throw new Error('Failed to send email');
      }

      console.log('OTP email sent:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  baseTemplate(title, previewText, bodyContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0F4FF;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0F4FF;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Logo / Brand header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#2563EB;border-radius:12px;padding:10px 20px;">
                    <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                      &#9783; ${this.appName}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

              <!-- Blue top bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);height:6px;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 40px 32px;">
                    ${bodyContent}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;">
                © ${new Date().getFullYear()} ${this.appName}. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#CBD5E1;">
                This is an automated email — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  generateOTPEmailTemplate(otp, context = 'verification') {
    const expiryMinutes = config.otp?.expiryMinutes || 5;

    const contextMap = {
      verification: {
        icon: '✉️',
        heading: 'Verify your email',
        subtext: 'Enter the code below to complete your verification.',
      },
      mfa: {
        icon: '🔐',
        heading: 'Two-factor authentication',
        subtext: 'Enter the code below to complete your login.',
      },
      reset: {
        icon: '🔑',
        heading: 'Reset your password',
        subtext: 'Enter the code below to reset your password.',
      },
    };

    const ctx = contextMap[context] || contextMap.verification;

    const digits = otp.toString().split('').map(d =>
      `<td style="padding:0 4px;">
        <div style="width:44px;height:56px;line-height:56px;background-color:#F8FAFF;border:2px solid #DBEAFE;border-radius:10px;text-align:center;font-size:28px;font-weight:700;color:#1E40AF;letter-spacing:0;">${d}</div>
      </td>`
    ).join('');

    const body = `
      <!-- Icon -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td>
            <div style="width:52px;height:52px;background-color:#EFF6FF;border-radius:14px;text-align:center;line-height:52px;font-size:26px;">${ctx.icon}</div>
          </td>
        </tr>
      </table>

      <!-- Heading -->
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F172A;letter-spacing:-0.5px;">${ctx.heading}</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#64748B;line-height:1.6;">${ctx.subtext}</p>

      <!-- OTP digits -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>${digits}</tr>
      </table>

      <!-- Expiry notice -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:#FFF7ED;border-left:4px solid #F97316;border-radius:0 8px 8px 0;padding:12px 16px;">
            <p style="margin:0;font-size:13px;color:#92400E;">
              ⏱ This code expires in <strong>${expiryMinutes} minutes</strong>. Do not share it with anyone.
            </p>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr><td style="border-top:1px solid #F1F5F9;font-size:0;">&nbsp;</td></tr>
      </table>

      <p style="margin:0;font-size:12px;color:#94A3B8;">If you didn't request this, you can safely ignore this email. Your account remains secure.</p>
    `;

    return this.baseTemplate(ctx.heading, `Your ${expiryMinutes}-minute verification code is ${otp}`, body);
  }

  generateSendReminderTemplate(data) {
    const safeTitle       = this.sanitizeText(data.title);
    const safeDescription = this.sanitizeText(data.description || '');
    const reminderDate    = new Date(data.date);

    const dateStr = reminderDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = reminderDate.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const body = `
      <!-- Icon -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td>
            <div style="width:52px;height:52px;background-color:#EFF6FF;border-radius:14px;text-align:center;line-height:52px;font-size:26px;">🔔</div>
          </td>
        </tr>
      </table>

      <!-- Heading -->
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#2563EB;text-transform:uppercase;letter-spacing:0.8px;">Upcoming Reminder</p>
      <h1 style="margin:0 0 28px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">${safeTitle}</h1>

      <!-- Date/time card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:${safeDescription ? '24px' : '32px'};">
        <tr>
          <td style="background-color:#F8FAFF;border:1px solid #DBEAFE;border-radius:12px;padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:50%;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.6px;">Date</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1E293B;">${dateStr}</p>
                </td>
                <td style="width:50%;padding-left:24px;border-left:1px solid #DBEAFE;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.6px;">Time</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1E293B;">${timeStr}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${safeDescription ? `
      <!-- Description -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td style="padding:16px 20px;background-color:#F8FAFF;border-radius:10px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.6px;">Note</p>
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${safeDescription}</p>
          </td>
        </tr>
      </table>` : ''}

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr><td style="border-top:1px solid #F1F5F9;font-size:0;">&nbsp;</td></tr>
      </table>

      <p style="margin:0;font-size:12px;color:#94A3B8;">This reminder was set up in your ${this.appName} account. Log in to manage your reminders.</p>
    `;

    return this.baseTemplate(
      `Reminder: ${safeTitle}`,
      `Your reminder "${safeTitle}" is coming up on ${dateStr} at ${timeStr}`,
      body
    );
  }

  async sendReminderEmail(email, data) {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromReminder,
        to: email,
        subject: `🔔 Reminder: ${data.title}`,
        html: this.generateSendReminderTemplate(data),
      });

      if (error) {
        console.error('Resend error sending reminder email:', error);
        return;
      }

      console.log(`Reminder email sent to ${email}`);
    } catch (error) {
      console.error('Error sending reminder email:', error);
    }
  }

  async verifyConnection() {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set');
      }
      console.log('Email service (Resend) is ready');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();