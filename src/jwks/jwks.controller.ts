import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { importSPKI, exportJWK } from 'jose';

@ApiTags('System')
@Controller('.well-known')
export class JwksController {
  @Get('jwks.json')
  @ApiOperation({ summary: 'Public JWKS endpoint' })
  async jwks() {
    const b64 = process.env.JWT_PUBLIC_KEY_BASE64;
    if (!b64) {
      return { keys: [] };
    }

    const pem = Buffer.from(b64, 'base64').toString('utf8');

    try {
      // importSPKI expects a SubjectPublicKeyInfo PEM (-----BEGIN PUBLIC KEY-----)
      const key = await importSPKI(pem, 'RS256');
      const jwk = await exportJWK(key);

      // Ensure required fields
      jwk.alg = 'RS256';
      jwk.use = 'sig';
      if (process.env.JWT_KID) jwk.kid = process.env.JWT_KID;

      return { keys: [jwk] };
    } catch (err) {
      console.error('Failed to build JWKS:', err);
      return { keys: [] };
    }
  }
}
