import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      verify: jest.fn().mockResolvedValue(true),
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should send otp email', async () => {
      const email = 'test@example.com';
      const code = '123456';

      await service.sendOtp(email, code);

      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
        to: email,
        html: expect.stringContaining(code),
      }));
    });

    it('should throw error if send fails', async () => {
      sendMailMock.mockRejectedValue(new Error('fail'));
      await expect(service.sendOtp('test@example.com', '123456')).rejects.toThrow();
    });
  });
});
