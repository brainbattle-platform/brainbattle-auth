import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Display name (max 30 characters)',
    example: 'John Doe',
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Bio (max 120 characters)',
    example: 'Learning English through BrainBattle!',
    maxLength: 120,
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  bio?: string;
}

