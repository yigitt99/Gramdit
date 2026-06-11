import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder-id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder-secret',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const fullName = name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : undefined;
    const avatarUrl = photos?.[0]?.value;

    if (!email) {
      return done(new Error('No email returned from Google'), null);
    }

    try {
      const oauthUser = await this.authService.validateOAuthUser({
        email,
        fullName,
        avatarUrl,
      });
      done(null, oauthUser);
    } catch (err) {
      done(err, null);
    }
  }
}
