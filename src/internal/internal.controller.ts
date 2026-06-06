import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalGuard } from './internal.guard';
import { RankSyncDto } from './dto/rank-sync.dto';
import { WalletSyncDto } from './dto/wallet-sync.dto';
import { InternalProfileService } from './internal-profile.service';

@ApiTags('Internal')
@ApiHeader({
  name: 'x-internal-service-key',
  required: true,
  description: 'Internal service key for BrainBattle services',
})
@UseGuards(InternalGuard)
@Controller('internal')
export class InternalController {
  constructor(private readonly service: InternalProfileService) {}

  @Patch('learner-profiles/rank-sync')
  @ApiOperation({
    summary: 'Sync battle rank and BrainPoint balance to Auth service',
  })
  syncRank(@Body() dto: RankSyncDto) {
    return this.service.syncRank(dto);
  }

  @Patch('profile-sync')
  @ApiOperation({
    summary: 'Alias endpoint for Battle service rank/profile sync',
  })
  syncProfileAlias(@Body() dto: RankSyncDto) {
    return this.service.syncRank(dto);
  }

  @Patch('users/wallet-sync')
  @ApiOperation({
    summary: 'Sync primary wallet address for a user',
  })
  syncWallet(@Body() dto: WalletSyncDto) {
    return this.service.syncWallet(dto);
  }

  @Get('users/:userId/wallet')
  @ApiOperation({
    summary: 'Get user wallet for blockchain settlement',
  })
  getWallet(@Param('userId') userId: string) {
    return this.service.getWallet(userId);
  }

  @Get('users/public-profiles/:userId')
  @ApiOperation({
    summary: 'Get public profile for Battle/Mobile/Admin display',
  })
  getPublicProfile(@Param('userId') userId: string) {
    return this.service.getPublicProfile(userId);
  }
}