import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private static readonly logger = new Logger(FacebookStrategy.name);
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('FACEBOOK_CLIENT_ID');
    const clientSecret = configService.get<string>('FACEBOOK_CLIENT_SECRET');
    const callbackURL = configService.get<string>('FACEBOOK_REDIRECT_URI');

    const isConfigured = !!(clientID && clientSecret && callbackURL);

    // Only initialize strategy if credentials are provided
    if (isConfigured) {
      super({
        clientID: clientID!,
        clientSecret: clientSecret!,
        callbackURL: callbackURL!,
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      });
      FacebookStrategy.logger.log('Facebook OAuth enabled');
    } else {
      // Initialize with dummy values to prevent crash
      // Strategy won't work but won't crash the app
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL: 'http://localhost:3000/oauth/facebook/callback',
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      });
      FacebookStrategy.logger.warn(
        'Facebook OAuth disabled: missing FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, or FACEBOOK_REDIRECT_URI',
      );
    }

    // Set isConfigured after super() call
    this.isConfigured = isConfigured;
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    // Check if OAuth is configured before processing
    if (!this.isConfigured) {
      throw new Error('Facebook OAuth is not configured');
    }

    const email = profile.emails?.[0]?.value; // FB đôi khi không trả email nếu không cấp quyền
    return {
      provider: 'facebook',
      providerAccountId: profile.id,
      email,
      displayName: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    };
  }
}
