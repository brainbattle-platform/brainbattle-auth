import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TokensService } from './tokens.service';
import { PrismaModule } from '../prisma.module';
import { MailModule } from '../mail/mail.module';
import { OtpService } from './otp.service';

@Module({
  imports: [UsersModule, PrismaModule, MailModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokensService, OtpService],
})
export class AuthModule {}