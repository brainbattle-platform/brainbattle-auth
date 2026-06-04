import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../auth-context/decorators/current-user.decorator';
import { Roles } from '../auth-context/decorators/roles.decorator';
import { RolesGuard } from '../auth-context/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth-context/guards/supabase-auth.guard';
import type { CurrentUser } from '../auth-context/interfaces/current-user.interface';
import { AdminUsersService } from './admin-users.service';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin Users')
@ApiBearerAuth('bearer')
@Controller('admin/users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @Roles('admin', 'moderator', 'auditor')
  listUsers() {
    return this.adminUsersService.listUsers();
  }

  @Get(':id')
  @Roles('admin', 'moderator', 'auditor')
  getUser(@Param('id') id: string) {
    return this.adminUsersService.getUser(id);
  }

  @Patch(':id/status')
  @Roles('admin', 'moderator')
  updateStatus(
    @CurrentUserDecorator() actor: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateStatus(actor.id, id, dto.status);
  }

  @Patch(':id/roles')
  @Roles('admin')
  updateRoles(
    @CurrentUserDecorator() actor: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.adminUsersService.updateRoles(actor.id, id, dto.roles);
  }
}