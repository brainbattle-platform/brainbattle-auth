import { IsOptional, IsString, Matches } from 'class-validator';

export class WalletSyncDto {
  @IsString()
  userId!: string;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  walletAddress!: string;

  @IsOptional()
  @IsString()
  walletProvider?: string;
}