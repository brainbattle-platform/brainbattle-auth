import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterVerifyDto {
  @IsEmail() email!: string;
  @IsString() otp!: string;
  @IsString() @MinLength(8) password!: string;
  displayName?: string;
}
