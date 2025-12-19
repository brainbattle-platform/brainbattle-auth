import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller('.well-known')
export class JwksController {
  @Get('jwks.json')
  @ApiOperation({ summary: 'Public JWKS endpoint' })
  jwks() {
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
