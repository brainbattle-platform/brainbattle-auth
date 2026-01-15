import { IsString, IsOptional, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimpleSignupDto {
  @ApiProperty({
    description: 'Username (3-20 chars, alphanumeric + ._-)',
    example: 'john_doe',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username must contain only letters, numbers, dots, underscores, and hyphens',
  })
  username: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Display name (optional, defaults to username)',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  displayName?: string;
}

