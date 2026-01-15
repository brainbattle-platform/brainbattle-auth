
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const user = { id: '1', email };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      expect(await service.findByEmail(email)).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
    });
  });

  describe('createWithPassword', () => {
    it('should create user with password', async () => {
      const email = 'test@example.com';
      const passwordHash = 'hash';
      const displayName = 'Test User';
      const user = { id: '1', email, passwordHash, displayName };
      (prisma.user.create as jest.Mock).mockResolvedValue(user);

      expect(await service.createWithPassword(email, passwordHash, displayName)).toEqual(user);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email, passwordHash, displayName },
      });
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const id = '1';
      const user = { id, email: 'test@example.com' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      expect(await service.findById(id)).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id } });
    });
  });
});
