import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';
import { TokensService } from './tokens.service';
import { MailService } from '../mail/mail.service';
import { OtpService } from './otp.service';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let tokensService: TokensService;
  let mailService: MailService;
  let otpService: OtpService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    createWithPassword: jest.fn(),
    findById: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockTokensService = {
    signRefreshToken: jest.fn(),
    signAccessToken: jest.fn(),
    verifyRefresh: jest.fn(),
  };

  const mockMailService = {
    sendOtp: jest.fn(),
  };

  const mockOtpService = {
    createOrResend: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TokensService, useValue: mockTokensService },
        { provide: MailService, useValue: mockMailService },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    tokensService = module.get<TokensService>(TokensService);
    mailService = module.get<MailService>(MailService);
    otpService = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerStart', () => {
    it('should send otp if email not registered', async () => {
      const email = 'test@example.com';
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (otpService.createOrResend as jest.Mock).mockResolvedValue({ code: '123456', expiresAt: new Date() });

      await service.registerStart(email);

      expect(otpService.createOrResend).toHaveBeenCalledWith(email, 'register');
      expect(mailService.sendOtp).toHaveBeenCalledWith(email, '123456');
    });

    it('should throw if email registered', async () => {
      const email = 'test@example.com';
      (usersService.findByEmail as jest.Mock).mockResolvedValue({ passwordHash: 'hash' });

      await expect(service.registerStart(email)).rejects.toThrow('Email already registered');
    });
  });

  describe('registerVerify', () => {
    it('should verify otp and create user', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      const password = 'pass';
      const displayName = 'Test';
      const user = { id: '1', email };
      const session = { id: '1' };

      (otpService.verify as jest.Mock).mockResolvedValue(true);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hash');
      (usersService.createWithPassword as jest.Mock).mockResolvedValue(user);
      (prisma.session.create as jest.Mock).mockResolvedValue(session);
      (tokensService.signRefreshToken as jest.Mock).mockReturnValue('refresh');
      (tokensService.signAccessToken as jest.Mock).mockReturnValue('access');

      const result = await service.registerVerify(email, otp, password, displayName);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(usersService.createWithPassword).toHaveBeenCalled();
    });
  });

  describe('validateLogin', () => {
    it('should validate login and return tokens', async () => {
      const email = 'test@example.com';
      const password = 'pass';
      const user = { id: '1', email, passwordHash: 'hash' };
      const session = { id: '1' };

      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (prisma.session.create as jest.Mock).mockResolvedValue(session);
      (tokensService.signRefreshToken as jest.Mock).mockReturnValue('refresh');
      (tokensService.signAccessToken as jest.Mock).mockReturnValue('access');

      const result = await service.validateLogin(email, password);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw if invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'pass';
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.validateLogin(email, password)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshToken = 'refresh';
      const payload = { sid: '1', sub: '1' };
      const session = { id: '1', refreshHash: 'hash', expiresAt: new Date(Date.now() + 10000) };
      const user = { id: '1', email: 'test@example.com' };

      (tokensService.verifyRefresh as jest.Mock).mockReturnValue(payload);
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (usersService.findById as jest.Mock).mockResolvedValue(user);
      (tokensService.signRefreshToken as jest.Mock).mockReturnValue('newRefresh');
      (tokensService.signAccessToken as jest.Mock).mockReturnValue('newAccess');

      const result = await service.refresh(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken', 'newRefresh');
    });
  });

  describe('logout', () => {
    it('should revoke session', async () => {
      const refreshToken = 'refresh';
      const payload = { sid: '1' };
      (tokensService.verifyRefresh as jest.Mock).mockReturnValue(payload);

      await service.logout(refreshToken);

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: payload.sid },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('oauthLogin', () => {
    it('should login with oauth', async () => {
      const profile = { provider: 'google', providerAccountId: '123', email: 'test@example.com' };
      const user = { id: '1', email: 'test@example.com' };
      const session = { id: '1' };

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.session.create as jest.Mock).mockResolvedValue(session);
      (tokensService.signRefreshToken as jest.Mock).mockReturnValue('refresh');
      (tokensService.signAccessToken as jest.Mock).mockReturnValue('access');

      const result = await service.oauthLogin(profile);

      expect(result).toHaveProperty('accessToken');
      expect(prisma.account.create).toHaveBeenCalled();
    });
  });
});
