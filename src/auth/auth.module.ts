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

import { SimpleAuthService } from './simple-auth.service';
import { SimpleAuthController } from './simple-auth.controller';

@Module({
  imports: [UsersModule, PrismaModule, MailModule, JwtModule.register({})],
  controllers: [AuthController, OauthController, SimpleAuthController],
  providers: [
    AuthService,
    TokensService,
    OtpService,
    SimpleAuthService,
    // OAuth strategies will check env vars in constructor and log warnings if missing
    // They will still be registered but won't work without proper credentials
    //GoogleStrategy,
    //FacebookStrategy,
  ],
})
export class AuthModule {}