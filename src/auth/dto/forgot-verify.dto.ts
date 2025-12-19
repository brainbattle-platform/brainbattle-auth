import { ApiProperty } from '@nestjs/swagger';

export class ForgotVerifyDto {
  @ApiProperty({ example: 'user@mail.com' })
  email: string;

  @ApiProperty({ example: '123456' })
  otp: string;

  @ApiProperty({ example: 'NewStrongPassword123' })
  newPassword: string;
}
