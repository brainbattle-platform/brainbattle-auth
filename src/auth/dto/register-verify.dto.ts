import { ApiProperty } from '@nestjs/swagger';

export class RegisterVerifyDto {
  @ApiProperty({ example: 'user@mail.com' })
  email: string;

  @ApiProperty({ example: '123456' })
  otp: string;

  @ApiProperty({ example: 'StrongPassword123' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;
}
