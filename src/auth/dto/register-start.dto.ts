import { ApiProperty } from '@nestjs/swagger';

export class RegisterStartDto {
  @ApiProperty({ example: 'user@mail.com' })
  email: string;
}
