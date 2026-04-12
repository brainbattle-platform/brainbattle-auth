import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.profile.findFirst({
        where: {
          username: dto.username,
          NOT: { id: userId },
        },
      });
      if (existing) throw new ConflictException('Username already taken');
    }

    return this.prisma.profile.update({
      where: { id: userId },
      data: {
        username: dto.username,
        displayName: dto.display_name,
        avatarUrl: dto.avatar_url,
        bio: dto.bio,
      },
    });
  }
}