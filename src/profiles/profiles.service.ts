import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found. Call /auth/bootstrap first.');
    }

    return profile;
  }

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found. Call /auth/bootstrap first.');
    }

    if (dto.username) {
      const existing = await this.prisma.profile.findFirst({
        where: {
          username: dto.username,
          NOT: { id: userId },
        },
      });

      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    const updated = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        username: dto.username,
        displayName: dto.display_name,
        avatarUrl: dto.avatar_url,
        bio: dto.bio,
      },
    });

    await this.prisma.userAuditEvent.create({
      data: {
        userId,
        eventType: 'profile.updated',
        payload: {
          changed_fields: Object.keys(dto),
        },
      },
    });

    return updated;
  }
}