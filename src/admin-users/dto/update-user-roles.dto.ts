import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(['user', 'admin'], { each: true })
  roles!: string[];
}