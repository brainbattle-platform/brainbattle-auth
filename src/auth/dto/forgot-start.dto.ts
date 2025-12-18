import { ApiProperty } from '@nestjs/swagger';

export class ForgotStartDto {
  @ApiProperty({ example: 'user@mail.com' })
  email: string;
}
