import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from './decorators/current-user.decorator';
import type { CurrentUser } from './interfaces/current-user.interface';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthContextService } from './auth-context.service';

@ApiTags('Supabase Auth')
@ApiBearerAuth('bearer')
@Controller('auth')
export class AuthContextController {
  constructor(private readonly authContextService: AuthContextService) {}

  @Post('bootstrap')
  @UseGuards(SupabaseAuthGuard)
  bootstrap(@CurrentUserDecorator() user: CurrentUser) {
    return this.authContextService.bootstrap(user);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  me(@CurrentUserDecorator() user: CurrentUser) {
    return this.authContextService.getAuthContext(user);
  }
}