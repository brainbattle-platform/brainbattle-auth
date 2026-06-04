import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateLearnerProfileDto {
  @IsOptional()
  @IsString()
  goal_type?: string;

  @IsOptional()
  @IsString()
  current_level?: string;

  @IsOptional()
  @IsString()
  target_level?: string;

  @IsOptional()
  @IsString()
  native_language?: string;

  @IsOptional()
  @IsString()
  target_language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focus_skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weak_skills?: string[];
}