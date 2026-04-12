import { IsIn, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(['active', 'banned', 'suspended'])
  status!: string;
}