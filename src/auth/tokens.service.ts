import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

function fromBase64(b64?: string) {
  return b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';
}

export interface AccessTokenPayload {
  sub: string;          
  roles: string[];      
}

export interface RefreshTokenPayload {
  sub: string;          
  sid: string;          
}

@Injectable()
export class TokensService {
  private readonly issuer = process.env.JWT_ISS!;
  private readonly audience = process.env.JWT_AUD!;
  private readonly accessTtl = parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10);
  private readonly refreshTtl = parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10);

  private readonly privateKey = fromBase64(process.env.JWT_PRIVATE_KEY_BASE64);
  private readonly publicKey = fromBase64(process.env.JWT_PUBLIC_KEY_BASE64);

  constructor(private readonly jwt: JwtService) {}

  signAccessToken(user: { id: string; roles?: string[] }) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      roles: user.roles ?? ['USER'],
    };

    return this.jwt.sign(payload, {
      algorithm: 'RS256',
      privateKey: this.privateKey,
      expiresIn: this.accessTtl,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  verifyAccess(token: string): AccessTokenPayload {
    return this.jwt.verify(token, {
      algorithms: ['RS256'],
      publicKey: this.publicKey,
      issuer: this.issuer,
      audience: this.audience,
    }) as AccessTokenPayload;
  }

  signRefreshToken(payload: { userId: string; sessionId: string }) {
    const refreshPayload: RefreshTokenPayload = {
      sub: payload.userId,
      sid: payload.sessionId,
    };

    return this.jwt.sign(refreshPayload, {
      algorithm: 'RS256',
      privateKey: this.privateKey,
      expiresIn: this.refreshTtl,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  verifyRefresh(token: string): RefreshTokenPayload {
    return this.jwt.verify(token, {
      algorithms: ['RS256'],
      publicKey: this.publicKey,
      issuer: this.issuer,
      audience: this.audience,
    }) as RefreshTokenPayload;
  }
}
