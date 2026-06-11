import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    let privateKey = 'placeholder-key';
    const keyPath = configService.get<string>('APPLE_PRIVATE_KEY_PATH');
    if (keyPath) {
      const fullPath = join(process.cwd(), keyPath);
      if (existsSync(fullPath)) {
        try {
          privateKey = readFileSync(fullPath, 'utf8');
        } catch (e) {
          // ignore reading error in development
        }
      }
    }

    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID') || 'placeholder-client-id',
      teamID: configService.get<string>('APPLE_TEAM_ID') || 'placeholder-team-id',
      keyID: configService.get<string>('APPLE_KEY_ID') || 'placeholder-key-id',
      privateKeyString: privateKey,
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL') || 'http://localhost:3000/api/v1/auth/apple/callback',
      scope: ['email', 'name'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const email = profile?.email;
    const fullName = profile?.name ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim() : undefined;

    if (!email) {
      return done(new Error('No email returned from Apple'), null);
    }

    try {
      const oauthUser = await this.authService.validateOAuthUser({
        email,
        fullName,
      });
      done(null, oauthUser);
    } catch (err) {
      done(err, null);
    }
  }
}
