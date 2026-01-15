import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger(GoogleStrategy.name);
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_REDIRECT_URI');

    const isConfigured = !!(clientID && clientSecret && callbackURL);

    // Only initialize strategy if credentials are provided
    if (isConfigured) {
      super({
        clientID: clientID!,
        clientSecret: clientSecret!,
        callbackURL: callbackURL!,
        scope: ['email', 'profile'],
      });
      GoogleStrategy.logger.log('Google OAuth enabled');
    } else {
      // Initialize with dummy values to prevent crash
      // Strategy won't work but won't crash the app
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL: 'http://localhost:3000/oauth/google/callback',
        scope: ['email', 'profile'],
      });
      GoogleStrategy.logger.warn(
        'Google OAuth disabled: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI',
      );
    }

    // Set isConfigured after super() call
    this.isConfigured = isConfigured;
  }

  // payload gắn vào req.user
  validate(accessToken: string, refreshToken: string, profile: Profile) {
    // Check if OAuth is configured before processing
    if (!this.isConfigured) {
      throw new Error('Google OAuth is not configured');
    }

    const email = profile.emails?.[0]?.value;
    return {
      provider: 'google',
      providerAccountId: profile.id,
      email,
      displayName: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    };
  }
}
