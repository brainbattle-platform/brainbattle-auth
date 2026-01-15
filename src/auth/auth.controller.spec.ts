import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    registerStart: jest.fn(),
    registerVerify: jest.fn(),
    validateLogin: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotStart: jest.fn(),
    forgotVerify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('start', () => {
    it('should call authService.registerStart', async () => {
      const dto = { email: 'test@example.com' };
      await controller.start(dto);
      expect(authService.registerStart).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('verify', () => {
    it('should call authService.registerVerify', async () => {
      const dto = { email: 'test@example.com', otp: '123456', password: 'pass', displayName: 'Test' };
      await controller.verify(dto);
      expect(authService.registerVerify).toHaveBeenCalledWith(dto.email, dto.otp, dto.password, dto.displayName);
    });
  });

  describe('login', () => {
    it('should call authService.validateLogin', async () => {
      const body = { email: 'test@example.com', password: 'pass' };
      await controller.login(body);
      expect(authService.validateLogin).toHaveBeenCalledWith(body.email, body.password);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh', async () => {
      const body = { refreshToken: 'token' };
      await controller.refresh(body);
      expect(authService.refresh).toHaveBeenCalledWith(body.refreshToken);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      const body = { refreshToken: 'token' };
      await controller.logout(body);
      expect(authService.logout).toHaveBeenCalledWith(body.refreshToken);
    });
  });

  describe('forgotStart', () => {
    it('should call authService.forgotStart', async () => {
      const dto = { email: 'test@example.com' };
      await controller.forgotStart(dto);
      expect(authService.forgotStart).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('forgotVerify', () => {
    it('should call authService.forgotVerify', async () => {
      const dto = { email: 'test@example.com', otp: '123456', newPassword: 'pass' };
      await controller.forgotVerify(dto);
      expect(authService.forgotVerify).toHaveBeenCalledWith(dto.email, dto.otp, dto.newPassword);
    });
  });

  describe('me', () => {
    it('should return user info', () => {
      const req = { user: { id: '1', email: 'test@example.com' } };
      expect(controller.me(req)).toEqual(req.user);
    });
  });
});
