import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimpleLoginDto {
  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
  })
  @IsString()
  @MinLength(1)
  password: string;
}

