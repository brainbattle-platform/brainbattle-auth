import { IsIn, IsString } from 'class-validator';
import { USER_STATUSES } from '../../auth-context/constants/auth.constants';

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(USER_STATUSES)
  status!: string;
}