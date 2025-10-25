import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import * as argon2 from 'argon2';
import { TokensService } from './tokens.service';
import { MailService } from '../mail/mail.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private prisma: PrismaService,
    private tokens: TokensService,
    private mail: MailService,
    private otp: OtpService,
  ) { }

  async registerStart(email: string) {
    // Nếu email đã tồn tại (đã có password) thì chặn
    const exists = await this.users.findByEmail(email);
    if (exists && exists.passwordHash) throw new BadRequestException('Email already registered');

    const { code, expiresAt } = await this.otp.createOrResend(email, 'register');
    await this.mail.sendOtp(email, code);
    return { ok: true, expiresAt };
  }

  async registerVerify(email: string, otp: string, password: string, displayName?: string) {
    await this.otp.verify(email, 'register', otp);

    // Nếu user chưa có -> tạo; nếu đã có (do đăng ký dở dang) -> cập nhật password
    const existing = await this.users.findByEmail(email);
    const passwordHash = await argon2.hash(password);

    let userId: string;
    if (!existing) {
      const user = await this.users.createWithPassword(email, passwordHash, displayName);
      userId = user.id;
    } else {
      const user = await this.prisma.user.update({
        where: { id: existing.id }, data: { passwordHash, displayName }
      });
      userId = user.id;
    }

    // Auto login -> issue tokens
    const tokens = await this['issueTokensFor'](userId, email, null);
    return tokens;
  }

  async register(email: string, password: string, displayName?: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new BadRequestException('Email already registered');
    const hash = await argon2.hash(password);
    const user = await this.users.createWithPassword(email, hash, displayName);
    return this.issueTokensFor(user.id, user.email, null);
  }

  async validateLogin(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokensFor(user.id, user.email, null);
  }

  private async issueTokensFor(userId: string, email: string, userAgent: string | null) {
    // tạo session mới + refresh rotation
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshHash: 'temp',     // set tạm, sẽ update sau để không lộ plaintext
        userAgent: userAgent ?? undefined,
        expiresAt: new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10) * 1000)),
      },
    });

    const refreshToken = this.tokens.signRefreshToken({ sessionId: session.id, userId });
    const refreshHash = await argon2.hash(refreshToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshHash },
    });

    const accessToken = this.tokens.signAccessToken({ id: userId, email });
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10) };
  }

  async refresh(refreshToken: string) {
    const payload = this.tokens.verifyRefresh(refreshToken); // { sid, sub }
    const session = await this.prisma.session.findUnique({ where: { id: payload.sid } });
    if (!session || session.revokedAt || session.expiresAt < new Date())
      throw new UnauthorizedException('Refresh revoked/expired');

    const ok = await argon2.verify(session.refreshHash, refreshToken);
    if (!ok) throw new UnauthorizedException('Refresh mismatch');

    // rotation: phát refresh mới + cập nhật hash
    const newRefresh = this.tokens.signRefreshToken({ sessionId: session.id, userId: payload.sub });
    const newHash = await argon2.hash(newRefresh);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshHash: newHash },
    });

    // phát access mới
    const user = await this.users.findById?.(payload.sub)  // nếu chưa có, thêm hàm dưới UsersService
      ?? await this.prisma.user.findUnique({ where: { id: payload.sub } });

    const accessToken = this.tokens.signAccessToken({ id: user!.id, email: user!.email });
    return { accessToken, refreshToken: newRefresh, tokenType: 'Bearer', expiresIn: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10) };
  }

  async logout(refreshToken: string) {
    try {
      const { sid } = this.tokens.verifyRefresh(refreshToken);
      await this.prisma.session.update({
        where: { id: sid },
        data: { revokedAt: new Date() },
      });
    } catch { /* ignore invalid token */ }
    return { ok: true };
  }
}
