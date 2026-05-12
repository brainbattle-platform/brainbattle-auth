import { IsInt, IsString, Min } from 'class-validator';

export class RankSyncDto {
  @IsString()
  userId!: string;

  @IsString()
  rankTier!: string;

  @IsInt()
  @Min(0)
  stars!: number;

  @IsString()
  seasonId!: string;

  @IsInt()
  @Min(0)
  winCount!: number;

  @IsInt()
  @Min(0)
  drawCount!: number;

  @IsInt()
  @Min(0)
  loseCount!: number;

  @IsInt()
  @Min(0)
  totalBattles!: number;

  @IsInt()
  @Min(0)
  brainPointBalance!: number;
}