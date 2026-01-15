import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { SimpleAuthService } from './simple-auth.service';
import { SimpleSignupDto } from './dto/simple-signup.dto';
import { SimpleLoginDto } from './dto/simple-login.dto';

@ApiTags('Simple Auth')
@Controller('auth/simple')
export class SimpleAuthController {
  constructor(private readonly simpleAuth: SimpleAuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up with username and password' })
  @ApiBody({ type: SimpleSignupDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        userId: 'uuid',
        username: 'john_doe',
        displayName: 'John Doe',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (username taken, validation error)',
  })
  async signup(@Body() dto: SimpleSignupDto) {
    return this.simpleAuth.signup(
      dto.username,
      dto.password,
      dto.displayName,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: SimpleLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        userId: 'uuid',
        username: 'john_doe',
        displayName: 'John Doe',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid username or password',
  })
  @ApiResponse({
    status: 403,
    description: 'Account is banned',
  })
  async login(@Body() dto: SimpleLoginDto) {
    return this.simpleAuth.login(dto.username, dto.password);
  }
}

