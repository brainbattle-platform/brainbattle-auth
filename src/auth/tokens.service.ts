import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

function fromBase64(b64?: string) {
  return b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';
}

@Injectable()
export class TokensService {
  private readonly issuer = process.env.JWT_ISSUER!;
  private readonly audience = process.env.JWT_AUDIENCE!;
  private readonly accessTtl = parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10);
  private readonly refreshTtl = parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10);

  private readonly privateKey = fromBase64(process.env.JWT_PRIVATE_KEY_BASE64);
  private readonly publicKey  = fromBase64(process.env.JWT_PUBLIC_KEY_BASE64);

  constructor(private jwt: JwtService) {}

  signAccessToken(user: { id: string; email: string }) {
    return this.jwt.sign(
      { sub: user.id, email: user.email },
      {
        algorithm: 'RS256',
        privateKey: this.privateKey,
        expiresIn: this.accessTtl,
        issuer: this.issuer,
        audience: this.audience,
      },
    );
  }

  signRefreshToken(payload: { sessionId: string; userId: string }) {
    return this.jwt.sign(
      { sid: payload.sessionId, sub: payload.userId },
      {
        algorithm: 'RS256',
        privateKey: this.privateKey,
        expiresIn: this.refreshTtl,
        issuer: this.issuer,
        audience: this.audience,
      },
    );
  }

  verifyAccess(token: string) {
    return this.jwt.verify(token, {
      algorithms: ['RS256'],
      publicKey: this.publicKey,
      issuer: this.issuer,
      audience: this.audience,
    }) as { sub: string; email: string };
  }

  verifyRefresh(token: string) {
    return this.jwt.verify(token, {
      algorithms: ['RS256'],
      publicKey: this.publicKey,
      issuer: this.issuer,
      audience: this.audience,
    }) as { sid: string; sub: string };
  }
}
