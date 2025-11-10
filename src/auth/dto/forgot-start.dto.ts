import { IsEmail } from 'class-validator';

export class ForgotStartDto {
  @IsEmail()
  email!: string;
}
