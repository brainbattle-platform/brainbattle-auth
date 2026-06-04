import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateLearnerProfileDto } from './dto/update-learner-profile.dto';

@Injectable()
export class LearnerProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Learner profile not found. Call /auth/bootstrap first.',
      );
    }

    return profile;
  }

  async updateMe(userId: string, dto: UpdateLearnerProfileDto) {
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!profile) {
      throw new NotFoundException(
        'Learner profile not found. Call /auth/bootstrap first.',
      );
    }

    const updated = await this.prisma.learnerProfile.update({
      where: { userId },
      data: {
        goalType: dto.goal_type,
        currentLevel: dto.current_level,
        targetLevel: dto.target_level,
        nativeLanguage: dto.native_language,
        targetLanguage: dto.target_language,
        focusSkills: dto.focus_skills,
        weakSkills: dto.weak_skills,
      },
    });

    await this.prisma.userAuditEvent.create({
      data: {
        userId,
        eventType: 'learner_profile.updated',
        payload: {
          changed_fields: Object.keys(dto),
        },
      },
    });

    return updated;
  }

  async completeOnboarding(userId: string) {
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!profile) {
      throw new NotFoundException(
        'Learner profile not found. Call /auth/bootstrap first.',
      );
    }

    const updated = await this.prisma.learnerProfile.update({
      where: { userId },
      data: { onboardingCompleted: true },
    });

    await this.prisma.userAuditEvent.create({
      data: {
        userId,
        eventType: 'learner_profile.onboarding_completed',
        payload: {},
      },
    });

    return updated;
  }
}