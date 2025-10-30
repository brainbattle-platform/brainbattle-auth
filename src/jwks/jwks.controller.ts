import { Controller, Get } from '@nestjs/common';

@Controller('.well-known')
export class JwksController {
  // Tối thiểu 1 key. Sau này có rotate thì trả thêm key với "kid" khác.
  @Get('jwks.json')
  getJwks() {
    return {
      keys: [
        {
          kty: 'RSA',
          kid: process.env.JWT_KID,           // ví dụ 'bb-key-1'
          use: 'sig',
          alg: 'RS256',
          n: process.env.JWT_PUBLIC_N!,       // modulus base64url
          e: process.env.JWT_PUBLIC_E!,       // exponent base64url (thường 'AQAB')
        },
      ],
    };
  }
}
