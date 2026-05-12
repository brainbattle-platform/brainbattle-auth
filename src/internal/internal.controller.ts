import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { InternalGuard } from './internal.guard';
import { RankSyncDto } from './dto/rank-sync.dto';
import { WalletSyncDto } from './dto/wallet-sync.dto';
import { InternalProfileService } from './internal-profile.service';

@UseGuards(InternalGuard)
@Controller('internal')
export class InternalController {
  constructor(private readonly service: InternalProfileService) {}

  @Patch('learner-profiles/rank-sync')
  syncRank(@Body() dto: RankSyncDto) {
    return this.service.syncRank(dto);
  }

  @Patch('users/wallet-sync')
  syncWallet(@Body() dto: WalletSyncDto) {
    return this.service.syncWallet(dto);
  }

  @Get('users/:userId/wallet')
  getWallet(@Param('userId') userId: string) {
    return this.service.getWallet(userId);
  }
}