import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../auth-context/decorators/current-user.decorator';
import type { CurrentUser } from 'src/auth-context/interfaces/current-user.interface';
import { SupabaseAuthGuard } from '../auth-context/guards/supabase-auth.guard';
import { UpdateLearnerProfileDto } from './dto/update-learner-profile.dto';
import { LearnerProfilesService } from './learner-profiles.service';

@ApiTags('Learner Profiles')
@ApiBearerAuth('bearer')
@Controller('learner-profiles')
@UseGuards(SupabaseAuthGuard)
export class LearnerProfilesController {
  constructor(private readonly learnerProfilesService: LearnerProfilesService) {}

  @Get('me')
  getMe(@CurrentUserDecorator() user: CurrentUser) {
    return this.learnerProfilesService.getMe(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpdateLearnerProfileDto,
  ) {
    return this.learnerProfilesService.updateMe(user.id, dto);
  }

  @Post('me/complete-onboarding')
  completeOnboarding(@CurrentUserDecorator() user: CurrentUser) {
    return this.learnerProfilesService.completeOnboarding(user.id);
  }
}