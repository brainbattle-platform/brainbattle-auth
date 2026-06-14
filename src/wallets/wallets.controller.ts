import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../auth-context/decorators/current-user.decorator';
import type { CurrentUser } from '../auth-context/interfaces/current-user.interface';
import { SupabaseAuthGuard } from '../auth-context/guards/supabase-auth.guard';
import { WalletsService } from './wallets.service';
import { LinkWalletDto } from './dto/link-wallet.dto';

@ApiTags('Wallets')
@ApiBearerAuth('bearer')
@Controller('wallets')
@UseGuards(SupabaseAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  getMine(@CurrentUserDecorator() user: CurrentUser) {
    return this.walletsService.getMine(user.id);
  }

  @Post('me/link')
  linkMine(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: LinkWalletDto,
  ) {
    return this.walletsService.linkMine(user.id, dto);
  }
}
