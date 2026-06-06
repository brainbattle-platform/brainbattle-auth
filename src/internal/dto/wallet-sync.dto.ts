import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class WalletSyncDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: '0x1111111111111111111111111111111111111111' })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  walletAddress!: string;

  @ApiPropertyOptional({ example: 'sepolia' })
  @IsOptional()
  @IsString()
  walletProvider?: string;
}