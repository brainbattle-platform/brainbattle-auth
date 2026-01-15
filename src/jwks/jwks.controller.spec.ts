import { Test, TestingModule } from '@nestjs/testing';
import { JwksController } from './jwks.controller';

describe('JwksController', () => {
  let controller: JwksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JwksController],
    }).compile();

    controller = module.get<JwksController>(JwksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getJwks', () => {
    it('should return jwks keys', () => {
      process.env.JWT_KID = 'test-kid';
      process.env.JWT_PUBLIC_N = 'test-n';
      process.env.JWT_PUBLIC_E = 'test-e';

      const result = controller.getJwks();
      expect(result).toEqual({
        keys: [
          {
            kty: 'RSA',
            kid: 'test-kid',
            use: 'sig',
            alg: 'RS256',
            n: 'test-n',
            e: 'test-e',
          },
        ],
      });
    });
  });
});
