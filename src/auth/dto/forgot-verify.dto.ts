import { IsEmail, IsString, MinLength } from 'class-validator';

export class ForgotVerifyDto {
  @IsEmail()
  email!: string;

  @IsString()
  otp!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
