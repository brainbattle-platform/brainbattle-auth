import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { ForgotStartDto } from './dto/forgot-start.dto';
import { ForgotVerifyDto } from './dto/forgot-verify.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

   @Post('register/start')
  start(@Body() dto: RegisterStartDto) {
    return this.auth.registerStart(dto.email);
  }

  @Post('register/verify')
  verify(@Body() dto: RegisterVerifyDto) {
    return this.auth.registerVerify(dto.email, dto.otp, dto.password, dto.displayName);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.validateLogin(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  logout(@Body() body: { refreshToken: string }) {
    return this.auth.logout(body.refreshToken);
  }

  @Post('forgot/start')
  forgotStart(@Body() dto: ForgotStartDto) {
    return this.auth.forgotStart(dto.email);
  }

  @Post('forgot/verify')
  forgotVerify(@Body() dto: ForgotVerifyDto) {
    return this.auth.forgotVerify(dto.email, dto.otp, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return { id: req.user.id, email: req.user.email };
  }
}
