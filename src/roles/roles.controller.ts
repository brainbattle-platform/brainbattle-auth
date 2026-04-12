import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../auth-context/decorators/current-user.decorator';
import type { CurrentUser } from '../auth-context/interfaces/current-user.interface';
import { SupabaseAuthGuard } from '../auth-context/guards/supabase-auth.guard';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('bearer')
@Controller('roles')
@UseGuards(SupabaseAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('me')
  async getMe(@CurrentUserDecorator() user: CurrentUser) {
    return {
      user_id: user.id,
      roles: await this.rolesService.getMyRoles(user.id),
    };
  }
}