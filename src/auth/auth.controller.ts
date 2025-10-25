import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() body: { email: string; password: string; displayName?: string }) {
    return this.auth.register(body.email, body.password, body.displayName);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.validateLogin(body.email, body.password);
  }
}
