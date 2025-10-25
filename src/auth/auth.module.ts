import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TokensService } from './tokens.service';
import { PrismaModule } from '../prisma.module';
import { MailModule } from '../mail/mail.module';
import { OtpService } from './otp.service';

import { GoogleStrategy } from './oauth/google.strategy';
import { FacebookStrategy } from './oauth/facebook.strategy';
import { OauthController } from './oauth.controller';

@Module({
  imports: [UsersModule, PrismaModule, MailModule, JwtModule.register({})],
  controllers: [AuthController, OauthController],
  providers: [AuthService, TokensService, OtpService, GoogleStrategy, FacebookStrategy],
})
export class AuthModule {}