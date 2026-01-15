import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from './tokens.service';
import { JwtService } from '@nestjs/jwt';

describe('TokensService', () => {
  let service: TokensService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    process.env.JWT_ISSUER = 'test-issuer';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.JWT_ACCESS_TTL = '900';
    process.env.JWT_REFRESH_TTL = '2592000';
    process.env.JWT_PRIVATE_KEY_BASE64 = Buffer.from('private-key').toString('base64');
    process.env.JWT_PUBLIC_KEY_BASE64 = Buffer.from('public-key').toString('base64');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signAccessToken', () => {
    it('should sign access token', () => {
      const user = { id: '1', email: 'test@example.com' };
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      expect(service.signAccessToken(user)).toBe('token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        expect.any(Object),
      );
    });
  });

  describe('signRefreshToken', () => {
    it('should sign refresh token', () => {
      const payload = { sessionId: '1', userId: '1' };
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      expect(service.signRefreshToken(payload)).toBe('token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sid: payload.sessionId, sub: payload.userId },
        expect.any(Object),
      );
    });
  });

  describe('verifyAccess', () => {
    it('should verify access token', () => {
      const token = 'token';
      const decoded = { sub: '1', email: 'test@example.com' };
      (jwtService.verify as jest.Mock).mockReturnValue(decoded);

      expect(service.verifyAccess(token)).toEqual(decoded);
      expect(jwtService.verify).toHaveBeenCalledWith(token, expect.any(Object));
    });
  });

  describe('verifyRefresh', () => {
    it('should verify refresh token', () => {
      const token = 'token';
      const decoded = { sid: '1', sub: '1' };
      (jwtService.verify as jest.Mock).mockReturnValue(decoded);

      expect(service.verifyRefresh(token)).toEqual(decoded);
      expect(jwtService.verify).toHaveBeenCalledWith(token, expect.any(Object));
    });
  });
});
