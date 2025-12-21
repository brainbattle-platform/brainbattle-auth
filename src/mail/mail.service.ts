import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendOtp(email: string, code: string) {
    try {
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
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'BrainBattle - Verify your email',
        html,
      });

      console.log(`[MAIL] Sent OTP to ${email}`);
    } catch (err: any) {
      console.error('[MAIL] sendOtp error:', err);
      throw new ServiceUnavailableException('Email service unavailable');
    }
  }
}
