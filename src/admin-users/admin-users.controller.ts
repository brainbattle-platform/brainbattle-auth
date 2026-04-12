import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth-context/decorators/roles.decorator';
import { RolesGuard } from '../auth-context/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth-context/guards/supabase-auth.guard';
import { AdminUsersService } from './admin-users.service';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin Users')
@ApiBearerAuth('bearer')
@Controller('admin/users')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers() {
    return this.adminUsersService.listUsers();
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.adminUsersService.getUser(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminUsersService.updateStatus(id, dto.status);
  }

  @Patch(':id/roles')
  updateRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.adminUsersService.updateRoles(id, dto.roles);
  }
}