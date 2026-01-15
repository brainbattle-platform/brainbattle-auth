import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateUserDto {
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

  @ApiPropertyOptional({
    description: 'Rank code',
    example: 'GOLD',
    enum: ['BRONZE', 'SILVER', 'GOLD'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['BRONZE', 'SILVER', 'GOLD'])
  rankCode?: string;

  @ApiPropertyOptional({
    description: 'User status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'BANNED'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'BANNED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'User role',
    example: 'USER',
    enum: ['USER', 'ADMIN'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: string;
}

