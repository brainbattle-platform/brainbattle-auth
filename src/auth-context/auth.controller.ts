import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CurrentUserDecorator } from './decorators/current-user.decorator';
import type { CurrentUser } from './interfaces/current-user.interface';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Controller('auth')
export class AuthContextController {
  constructor(private readonly prisma: PrismaService) { }

  @Get('me')
@UseGuards(SupabaseAuthGuard)
async me(@CurrentUserDecorator() user: CurrentUser) {
  const [profile, roles, learnerProfile] = await Promise.all([
    this.prisma.profile.findUnique({
      where: { id: user.id },
    }),
    this.prisma.userRole.findMany({
      where: { userId: user.id },
    }),
    this.prisma.learnerProfile.findUnique({
      where: { userId: user.id },
    }),
  ]);

  return {
    user_id: user.id,
    email: user.email,
    roles: roles.map((r) => r.role),
    profile: profile
      ? {
          username: profile.username,
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl,
          bio: profile.bio,
          status: profile.status,
        }
      : null,
    learner_profile: learnerProfile ?? null,
  };
}
}