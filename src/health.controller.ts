import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  ping() {
    return { ok: true, service: 'brainbattle-auth' };
  }
}
