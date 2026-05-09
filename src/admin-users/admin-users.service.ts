import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    const profiles = await this.prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const userIds = profiles.map((p) => p.id);

    const [roles, learnerProfiles] = await Promise.all([
      this.prisma.userRole.findMany({
        where: { userId: { in: userIds } },
      }),
      this.prisma.learnerProfile.findMany({
        where: { userId: { in: userIds } },
      }),
    ]);

    return profiles.map((profile) => ({
      ...profile,
      roles: roles.filter((r) => r.userId === profile.id),
      learnerProfile:
        learnerProfiles.find((lp) => lp.userId === profile.id) ?? null,
    }));
  }

  async getUser(userId: string) {
    const [profile, roles, learnerProfile, settings] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { id: userId },
      }),
      this.prisma.userRole.findMany({
        where: { userId },
      }),
      this.prisma.learnerProfile.findUnique({
        where: { userId },
      }),
      this.prisma.userSetting.findUnique({
        where: { userId },
      }),
    ]);

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return {
      ...profile,
      roles,
      learnerProfile,
      settings,
    };
  }

  async updateStatus(userId: string, status: string) {
    return this.prisma.profile.update({
      where: { id: userId },
      data: { status },
    });
  }

  async updateRoles(userId: string, roles: string[]) {
    await this.prisma.userRole.deleteMany({ where: { userId } });

    if (roles.length > 0) {
      await this.prisma.userRole.createMany({
        data: roles.map((role) => ({ userId, role })),
      });
    }

    return this.getUser(userId);
  }
}