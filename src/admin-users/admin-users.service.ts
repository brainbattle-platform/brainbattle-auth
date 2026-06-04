import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  APP_ROLES,
  USER_STATUSES,
} from '../auth-context/constants/auth.constants';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    const profiles = await this.prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const userIds = profiles.map((profile) => profile.id);

    const [roles, learnerProfiles, settings, wallets] = await Promise.all([
      this.prisma.userRole.findMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.learnerProfile.findMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.userSetting.findMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.walletLink.findMany({
        where: { userId: { in: userIds } },
      }),
    ]);

    return profiles.map((profile) => ({
      user_id: profile.id,
      email: profile.email,
      username: profile.username,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
      status: profile.status,
      roles: roles
        .filter((role) => role.userId === profile.id)
        .map((role) => role.role),
      learner_profile:
        learnerProfiles.find((item) => item.userId === profile.id) ?? null,
      settings: settings.find((item) => item.userId === profile.id) ?? null,
      wallet_count: wallets.filter((wallet) => wallet.userId === profile.id)
        .length,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    }));
  }

  async getUser(userId: string) {
    const [profile, roles, learnerProfile, settings, wallets, auditEvents] =
      await Promise.all([
        this.prisma.profile.findUnique({
          where: { id: userId },
        }),
        this.prisma.userRole.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.learnerProfile.findUnique({
          where: { userId },
        }),
        this.prisma.userSetting.findUnique({
          where: { userId },
        }),
        this.prisma.walletLink.findMany({
          where: { userId },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        }),
        this.prisma.userAuditEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
      ]);

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return {
      user_id: profile.id,
      email: profile.email,
      username: profile.username,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
      status: profile.status,
      roles: roles.map((role) => role.role),
      learner_profile: learnerProfile,
      settings,
      wallets,
      audit_events: auditEvents,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    };
  }

  async updateStatus(actorId: string, userId: string, status: string) {
    if (!USER_STATUSES.includes(status as any)) {
      throw new BadRequestException('Invalid user status');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.profile.update({
      where: { id: userId },
      data: { status },
    });

    await this.prisma.userAuditEvent.create({
      data: {
        userId,
        eventType: 'admin.user_status_updated',
        payload: {
          actor_id: actorId,
          old_status: profile.status,
          new_status: status,
        },
      },
    });

    return updated;
  }

  async updateRoles(actorId: string, userId: string, roles: string[]) {
    const normalizedRoles = [...new Set(roles)];

    if (normalizedRoles.length === 0) {
      throw new BadRequestException('User must have at least one role');
    }

    const invalidRole = normalizedRoles.find(
      (role) => !APP_ROLES.includes(role as any),
    );

    if (invalidRole) {
      throw new BadRequestException(`Invalid role: ${invalidRole}`);
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    const oldRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId },
      });

      await tx.userRole.createMany({
        data: normalizedRoles.map((role) => ({
          userId,
          role,
        })),
      });

      await tx.userAuditEvent.create({
        data: {
          userId,
          eventType: 'admin.user_roles_updated',
          payload: {
            actor_id: actorId,
            old_roles: oldRoles.map((item) => item.role),
            new_roles: normalizedRoles,
          },
        },
      });
    });

    return this.getUser(userId);
  }
}