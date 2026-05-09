import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateLearnerProfileDto } from './dto/update-learner-profile.dto';

@Injectable()
export class LearnerProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.learnerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Learner profile not found');
    return profile;
  }

  async updateMe(userId: string, dto: UpdateLearnerProfileDto) {
    return this.prisma.learnerProfile.update({
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
  }

  async completeOnboarding(userId: string) {
    return this.prisma.learnerProfile.update({
      where: { userId },
      data: { onboardingCompleted: true },
    });
  }
}