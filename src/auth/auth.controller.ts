import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { ForgotStartDto } from './dto/forgot-start.dto';
import { ForgotVerifyDto } from './dto/forgot-verify.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register/start')
  @ApiOperation({ summary: 'Start register (send OTP)' })
  registerStart(@Body() dto: RegisterStartDto) {
    return this.auth.registerStart(dto.email);
  }

  @Post('register/verify')
  @ApiOperation({ summary: 'Verify OTP & create account' })
  @ApiResponse({
    status: 200,
    description: 'Auth tokens',
    schema: {
      example: {
        accessToken: 'jwt',
        refreshToken: 'jwt',
        expiresIn: 900,
        user: { id: 'uuid' },
      },
    },
  })
  registerVerify(@Body() dto: RegisterVerifyDto) {
    return this.auth.registerVerify(
      dto.email,
      dto.otp,
      dto.password,
      dto.displayName,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email & password' })
  @ApiResponse({
    status: 200,
    description: 'Auth tokens',
    schema: {
      example: {
        accessToken: 'jwt',
        refreshToken: 'jwt',
        expiresIn: 900,
        user: { id: 'uuid' },
      },
    },
  })
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout & revoke refresh token' })
  logout(@Body() body: { refreshToken: string }) {
    return this.auth.logout(body.refreshToken);
  }

  @Post('forgot/start')
  @ApiOperation({ summary: 'Start forgot password flow' })
  forgotStart(@Body() dto: ForgotStartDto) {
    return this.auth.forgotStart(dto.email);
  }

  @Post('forgot/verify')
  @ApiOperation({ summary: 'Verify OTP & reset password' })
  forgotVerify(@Body() dto: ForgotVerifyDto) {
    return this.auth.forgotVerify(dto.email, dto.otp, dto.newPassword);
  }
}
