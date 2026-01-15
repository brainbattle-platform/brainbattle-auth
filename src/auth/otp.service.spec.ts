import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma.service';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('OtpService', () => {
  let service: OtpService;
  let prisma: PrismaService;

  const mockPrismaService = {
    emailOtp: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrResend', () => {
    it('should create new otp if not exists', async () => {
      const email = 'test@example.com';
      (prisma.emailOtp.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hash');

      const result = await service.createOrResend(email, 'register');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('expiresAt');
      expect(prisma.emailOtp.create).toHaveBeenCalled();
    });

    it('should throw if cooldown not passed', async () => {
      const email = 'test@example.com';
      const now = Date.now();
      (prisma.emailOtp.findUnique as jest.Mock).mockResolvedValue({
        resendAt: new Date(now + 10000),
      });

      await expect(service.createOrResend(email, 'register')).rejects.toThrow();
    });
  });

  describe('verify', () => {
    it('should verify otp', async () => {
      const email = 'test@example.com';
      const code = '123456';
      const hash = 'hash';
      (prisma.emailOtp.findUnique as jest.Mock).mockResolvedValue({
        purpose: 'register',
        expiresAt: new Date(Date.now() + 10000),
        codeHash: hash,
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      expect(await service.verify(email, 'register', code)).toBe(true);
      expect(prisma.emailOtp.delete).toHaveBeenCalledWith({ where: { email } });
    });

    it('should throw if otp expired', async () => {
      const email = 'test@example.com';
      (prisma.emailOtp.findUnique as jest.Mock).mockResolvedValue({
        purpose: 'register',
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(service.verify(email, 'register', '123456')).rejects.toThrow('OTP expired');
    });
  });
});
