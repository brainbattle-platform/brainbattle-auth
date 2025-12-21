import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterVerifyDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: '@Test123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'User', required: false })
  @IsString()
  displayName?: string;
}
