import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class LinkWalletDto {
  @ApiProperty({ example: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  walletAddress!: string;

  @ApiPropertyOptional({ example: 'LOCAL_HARDHAT' })
  @IsOptional()
  @IsString()
  chain?: string;

  @ApiPropertyOptional({ example: 'LOCAL_HARDHAT' })
  @IsOptional()
  @IsString()
  walletProvider?: string;
}
