import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import { TokensService } from './tokens.service';
import { MailService } from '../mail/mail.service';
import { OtpService } from './otp.service';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  data: {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

@Injectable()
export class AuthService {
  private readonly accessTtl = parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10);
  private readonly refreshTtl = parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10);

  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly mail: MailService,
    private readonly otp: OtpService,
  ) {}

  async registerStart(email?: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const exists = await this.users.findByEmail(email);
    if (exists && exists.passwordHash) {
      throw new BadRequestException('Email already registered');
    }

    const { code, expiresAt } = await this.otp.createOrResend(email, 'register');

    try {
      await this.mail.sendOtp(email, code);
    } catch (e) {
      console.error('MAIL ERROR', e);
      throw new BadRequestException('Failed to send OTP email');
    }

    return { ok: true, expiresAt };
  }

  async registerVerify(
    email: string,
    otp: string,
    password: string,
    displayName?: string,
  ): Promise<AuthResponse> {
    await this.otp.verify(email, 'register', otp);

    const existing = await this.users.findByEmail(email);
    const passwordHash = await argon2.hash(password);

    let user;

    if (!existing) {
      user = await this.users.createWithPassword(
        email,
        passwordHash,
        displayName,
        new Date(),
      );
    } else {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, displayName, emailVerified: new Date() },
      });
    }

    return this.issueTokensFor(user.id, user);
  }

  // (Giữ lại nếu bạn vẫn dùng endpoint /auth/register kiểu cũ)
  async register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new BadRequestException('Email already registered');

    const hash = await argon2.hash(password);
    const user = await this.users.createWithPassword(email, hash, displayName);

    return this.issueTokensFor(user.id, user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    return this.issueTokensFor(user.id, user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = this.tokens.verifyRefresh(refreshToken); // { sid, sub }

    const session = await this.prisma.session.findUnique({ where: { id: payload.sid } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh revoked/expired');
    }

    const ok = await argon2.verify(session.refreshHash, refreshToken);
    if (!ok) throw new UnauthorizedException('Refresh mismatch');

    const newRefresh = this.tokens.signRefreshToken({ sessionId: session.id, userId: payload.sub });
    const newHash = await argon2.hash(newRefresh);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshHash: newHash },
    });

    const accessToken = this.tokens.signAccessToken({ id: payload.sub });
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    return {
      accessToken,
      refreshToken: newRefresh,
      expiresIn: this.accessTtl,
      data: {
        userId: payload.sub,
        displayName: user?.displayName ?? null,
        avatarUrl: user?.avatarUrl ?? null,
      },
    };
  }

  async logout(refreshToken: string) {
    try {
      const { sid } = this.tokens.verifyRefresh(refreshToken);
      await this.prisma.session.update({
        where: { id: sid },
        data: { revokedAt: new Date() },
      });
    } catch {
      // ignore invalid token
    }
    return { ok: true };
  }

  // ✅ OAuth login (GIỮ NGUYÊN như bạn)
  async oauthLogin(profile: {
    provider: string;
    providerAccountId: string;
    email?: string;
    displayName?: string;
    avatar?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<AuthResponse> {
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
    });

    let user;

    if (existingAccount) {
      const userId = existingAccount.userId;

      await this.prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
        },
      });

      user = await this.prisma.user.findUnique({ where: { id: userId } });
    } else {
      let existingUser = profile.email ? await this.users.findByEmail(profile.email) : null;

      if (!existingUser) {
        existingUser = await this.prisma.user.create({
          data: {
            email: profile.email ?? `${profile.provider}-${profile.providerAccountId}@placeholder.local`,
            displayName: profile.displayName,
            avatarUrl: profile.avatar,
            emailVerified: profile.email ? new Date() : null,
          },
        });
      }

      const userId = existingUser.id;

      await this.prisma.account.create({
        data: {
          userId,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
        },
      });

      user = existingUser;
    }

    return this.issueTokensFor(user.id, user);
  }

  async forgotStart(email: string) {
    const user = await this.users.findByEmail(email);

    // không leak user tồn tại hay không
    if (!user || !user.passwordHash) return { ok: true };

    const { code, expiresAt } = await this.otp.createOrResend(email, 'reset');

    try {
      await this.mail.sendOtp(email, code);
    } catch (e) {
      console.error('MAIL ERROR', e);
      // vẫn trả ok để không leak + không làm client fail vì mail provider tạm thời
      return { ok: true };
    }

    return { ok: true, expiresAt };
  }

  async forgotVerify(email: string, otp: string, newPassword: string): Promise<AuthResponse> {
    await this.otp.verify(email, 'reset', otp);

    const user = await this.users.findByEmail(email);
    const passwordHash = await argon2.hash(newPassword);

    let updatedUser;

    if (!user) {
      const created = await this.users.createWithPassword(email, passwordHash, undefined);
      updatedUser = created;
    } else {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      updatedUser = updated;
    }

    await this.prisma.session.updateMany({
      where: { userId: updatedUser.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokensFor(updatedUser.id, updatedUser);
  }

  private async issueTokensFor(userId: string, user: any): Promise<AuthResponse> {
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshHash: 'temp',
        userAgent: null,
        expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      },
    });

    const refreshToken = this.tokens.signRefreshToken({ sessionId: session.id, userId });
    const refreshHash = await argon2.hash(refreshToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshHash },
    });

    const accessToken = this.tokens.signAccessToken({ id: userId });

    // Fetch full user data if not provided
    if (!user) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtl,
      data: {
        userId,
        displayName: user?.displayName ?? null,
        avatarUrl: user?.avatarUrl ?? null,
      },
    };
  }
}
