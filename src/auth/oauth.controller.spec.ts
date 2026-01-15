import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller';
import { AuthService } from './auth.service';

describe('OauthController', () => {
  let controller: OauthController;
  let authService: AuthService;

  const mockAuthService = {
    oauthLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<OauthController>(OauthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleCallback', () => {
    it('should call authService.oauthLogin', async () => {
      const req = { user: { provider: 'google', providerAccountId: '123' } };
      await controller.googleCallback(req);
      expect(authService.oauthLogin).toHaveBeenCalledWith(req.user);
    });
  });

  describe('facebookCallback', () => {
    it('should call authService.oauthLogin', async () => {
      const req = { user: { provider: 'facebook', providerAccountId: '123' } };
      await controller.facebookCallback(req);
      expect(authService.oauthLogin).toHaveBeenCalledWith(req.user);
    });
  });
});
