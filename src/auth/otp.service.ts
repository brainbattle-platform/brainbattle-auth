import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as argon2 from 'argon2';

function randomDigits(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
}

type OtpPurpose = 'register' | 'reset';

@Injectable()
export class OtpService {
  private ttl = Number(process.env.OTP_TTL || 600) * 1000;
  private cooldown = Number(process.env.OTP_RESEND_COOLDOWN || 60) * 1000;
  private length = Number(process.env.OTP_LENGTH || 6);

  constructor(private prisma: PrismaService) {}

  async createOrResend(email: string, purpose: OtpPurpose) {
    const now = Date.now();
    const existing = await this.prisma.emailOtp.findUnique({ where: { email } });

    if (existing && existing.resendAt.getTime() > now) {
      const left = Math.ceil((existing.resendAt.getTime() - now) / 1000);
      throw new BadRequestException(`Please wait ${left}s before requesting another OTP`);
    }

    const code = randomDigits(this.length);
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(now + this.ttl);
    const resendAt = new Date(now + this.cooldown);

    if (existing) {
      await this.prisma.emailOtp.update({
        where: { email },
        data: { codeHash, expiresAt, resendAt, purpose },
      });
    } else {
      await this.prisma.emailOtp.create({
        data: { email, codeHash, expiresAt, resendAt, purpose },
      });
    }
    return { code, expiresAt };
  }

  async verify(email: string, purpose: OtpPurpose, code: string) {
    const rec = await this.prisma.emailOtp.findUnique({ where: { email } });
    if (!rec || rec.purpose !== purpose) throw new BadRequestException('OTP not found');
    if (rec.expiresAt < new Date()) throw new BadRequestException('OTP expired');

    const ok = await argon2.verify(rec.codeHash, code);
    if (!ok) throw new BadRequestException('OTP invalid');

    // consume OTP
    await this.prisma.emailOtp.delete({ where: { email } });
    return true;
  }
}
