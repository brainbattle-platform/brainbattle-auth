import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RankSyncDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'SILVER' })
  @IsString()
  rankTier!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  stars!: number;

  @ApiPropertyOptional({ example: 'SEASON_2026_01' })
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  winCount!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  drawCount!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  loseCount!: number;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(0)
  totalBattles!: number;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(0)
  brainPointBalance!: number;
}