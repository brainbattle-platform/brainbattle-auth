import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUserDecorator } from '../auth-context/decorators/current-user.decorator';
import type { CurrentUser } from '../auth-context/interfaces/current-user.interface';
import { SupabaseAuthGuard } from '../auth-context/guards/supabase-auth.guard';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
@UseGuards(SupabaseAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMe(@CurrentUserDecorator() user: CurrentUser) {
    return this.profilesService.getMe(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUserDecorator() user: CurrentUser, @Body() dto: UpdateMyProfileDto) {
    return this.profilesService.updateMe(user.id, dto);
  }
}