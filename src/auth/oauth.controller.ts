import { Controller, Get, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@Controller('oauth')
export class OauthController {
  constructor(
    private readonly auth: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Check if Google OAuth is configured
    const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientID || !clientSecret) {
      throw new BadRequestException('Google OAuth is not configured');
    }
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any) {
    return this.auth.oauthLogin(req.user);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {
    // Check if Facebook OAuth is configured
    const clientID = this.configService.get<string>('FACEBOOK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('FACEBOOK_CLIENT_SECRET');
    if (!clientID || !clientSecret) {
      throw new BadRequestException('Facebook OAuth is not configured');
    }
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any) {
    return this.auth.oauthLogin(req.user);
  }
}
