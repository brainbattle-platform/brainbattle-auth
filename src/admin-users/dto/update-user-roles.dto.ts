import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';
import { APP_ROLES } from '../../auth-context/constants/auth.constants';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(APP_ROLES, { each: true })
  roles!: string[];
}