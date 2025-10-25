import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // false => STARTTLS
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    tls:
      process.env.SMTP_TLS_INSECURE === 'true'
        ? { rejectUnauthorized: false } // ⚠️ chỉ dùng tạm để test khi bị proxy SSL
        : { servername: process.env.SMTP_HOST! },
  });

  async sendOtp(email: string, code: string) {
    try {
      // optional verify SMTP connection
      await this.transporter.verify();

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif">
          <h2>BrainBattle - Email Verification</h2>
          <p>Your one-time verification code is:</p>
          <div style="font-size:24px;font-weight:bold;letter-spacing:4px;color:#673ab7">${code}</div>
          <p>This code will expire in 10 minutes.</p>
          <hr />
          <p style="font-size:12px;color:#999">If you didn’t request this, please ignore this email.</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || `"BrainBattle" <no-reply@brainbattle.app>`,
        to: email,
        subject: 'BrainBattle - Verify your email',
        html,
      });

      console.log(`[MAIL] Sent OTP to ${email}`);
    } catch (err: any) {
      console.error('[MAIL] sendOtp error:', err?.message || err);
      throw new ServiceUnavailableException('Email service unavailable');
    }
  }
}
