import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterStartDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail({}, { message: 'Email is invalid' })
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
