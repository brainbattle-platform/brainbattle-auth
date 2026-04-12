import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyRoles(userId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });
    return roles.map((r) => r.role);
  }
}