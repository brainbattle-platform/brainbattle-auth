import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthExceptionFilter } from '../common/filters/auth-exception.filter';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { ForgotStartDto } from './dto/forgot-start.dto';
import { ForgotVerifyDto } from './dto/forgot-verify.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('Auth')
@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('register/start')
  registerStart(@Body() dto: RegisterStartDto) {
    console.log('REGISTER START DTO:', dto);
    return this.auth.registerStart(dto.email);
  }


  @Post('register/verify')
  @ApiOperation({ summary: 'Verify OTP & create account' })
  @ApiResponse({
    status: 200,
    description: 'Auth tokens with user data',
    schema: {
      example: {
        accessToken: 'jwt...',
        refreshToken: 'jwt...',
        expiresIn: 900,
        data: {
          userId: 'uuid',
          displayName: 'John Doe',
          avatarUrl: 'https://example.com/avatar.png',
        },
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
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Auth tokens with user data',
    schema: {
      example: {
        accessToken: 'jwt...',
        refreshToken: 'jwt...',
        expiresIn: 900,
        data: {
          userId: 'uuid',
          displayName: 'John Doe',
          avatarUrl: 'https://example.com/avatar.png',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
          details: null,
        },
      },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout & revoke refresh token' })
  logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Post('forgot/start')
  @ApiOperation({ summary: 'Start forgot password flow' })
  forgotStart(@Body() dto: ForgotStartDto) {
    return this.auth.forgotStart(dto.email);
  }

  @Post('forgot/verify')
  @ApiOperation({ summary: 'Verify OTP & reset password' })
  forgotVerify(@Body() dto: ForgotVerifyDto) {
    return this.auth.forgotVerify(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
  }
}
