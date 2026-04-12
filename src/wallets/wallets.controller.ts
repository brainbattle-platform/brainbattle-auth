import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUserDecorator } from '../auth-context/decorators/current-user.decorator';
import type { CurrentUser } from '../auth-context/interfaces/current-user.interface';
import { SupabaseAuthGuard } from '../auth-context/guards/supabase-auth.guard';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(SupabaseAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  getMine(@CurrentUserDecorator() user: CurrentUser) {
    return this.walletsService.getMine(user.id);
  }
}