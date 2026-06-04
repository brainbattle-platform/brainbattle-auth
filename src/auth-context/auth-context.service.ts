import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { CurrentUser } from './interfaces/current-user.interface';
import {
  DEFAULT_ROLE,
  DEFAULT_USER_SETTINGS,
  type AppRole,
} from './constants/auth.constants';

@Injectable()
export class AuthContextService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(user: CurrentUser) {
    const authUser = await this.prisma.authUser.findUnique({
      where: { id: user.id },
      select: { id: true, email: true },
    });

    if (!authUser) {
      throw new ForbiddenException('Supabase auth user not found');
    }

    const created: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: user.id },
      });

      if (!profile) {
        await tx.profile.create({
          data: {
            id: user.id,
            email: authUser.email ?? user.email ?? '',
            status: 'active',
          },
        });
        created.push('profile');
      } else if (authUser.email && profile.email !== authUser.email) {
        await tx.profile.update({
          where: { id: user.id },
          data: { email: authUser.email },
        });
      }

      const learnerProfile = await tx.learnerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!learnerProfile) {
        await tx.learnerProfile.create({
          data: {
            userId: user.id,
            focusSkills: [],
            weakSkills: [],
            onboardingCompleted: false,
          },
        });
        created.push('learner_profile');
      }

      const roleCount = await tx.userRole.count({
        where: { userId: user.id },
      });

      if (roleCount === 0) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            role: DEFAULT_ROLE,
          },
        });
        created.push('user_role');
      }

      const settings = await tx.userSetting.findUnique({
        where: { userId: user.id },
      });

      if (!settings) {
        await tx.userSetting.create({
          data: {
            userId: user.id,
            ...DEFAULT_USER_SETTINGS,
          },
        });
        created.push('user_settings');
      }

      await tx.userAuditEvent.create({
        data: {
          userId: user.id,
          eventType: 'auth.bootstrap',
          payload: {
            email: authUser.email ?? user.email ?? null,
            created,
          },
        },
      });
    });

    return this.getAuthContext(user);
  }

  async getAuthContext(user: CurrentUser) {
    const [authUser, profile, roles, learnerProfile, settings, wallets] =
      await Promise.all([
        this.prisma.authUser.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            emailConfirmedAt: true,
            lastSignInAt: true,
            createdAt: true,
          },
        }),
        this.prisma.profile.findUnique({
          where: { id: user.id },
        }),
        this.prisma.userRole.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.learnerProfile.findUnique({
          where: { userId: user.id },
        }),
        this.prisma.userSetting.findUnique({
          where: { userId: user.id },
        }),
        this.prisma.walletLink.findMany({
          where: { userId: user.id },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        }),
      ]);

    if (profile?.status && profile.status !== 'active') {
      throw new ForbiddenException(`User account is ${profile.status}`);
    }

    const roleNames = roles.map((item) => item.role as AppRole);

    return {
      user_id: user.id,
      email: authUser?.email ?? user.email ?? null,
      email_confirmed_at: authUser?.emailConfirmedAt ?? null,
      last_sign_in_at: authUser?.lastSignInAt ?? null,

      roles: roleNames,
      is_admin: roleNames.includes('admin'),
      is_moderator: roleNames.includes('moderator'),
      is_auditor: roleNames.includes('auditor'),

      profile: profile
        ? {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            display_name: profile.displayName,
            avatar_url: profile.avatarUrl,
            bio: profile.bio,
            status: profile.status,
            created_at: profile.createdAt,
            updated_at: profile.updatedAt,
          }
        : null,

      learner_profile: learnerProfile
        ? {
            user_id: learnerProfile.userId,
            goal_type: learnerProfile.goalType,
            current_level: learnerProfile.currentLevel,
            target_level: learnerProfile.targetLevel,
            native_language: learnerProfile.nativeLanguage,
            target_language: learnerProfile.targetLanguage,
            focus_skills: learnerProfile.focusSkills ?? [],
            weak_skills: learnerProfile.weakSkills ?? [],
            onboarding_completed: learnerProfile.onboardingCompleted,
            created_at: learnerProfile.createdAt,
            updated_at: learnerProfile.updatedAt,
          }
        : null,

      settings: settings
        ? {
            timezone: settings.timezone,
            language: settings.language,
            notification_enabled: settings.notificationEnabled,
          }
        : null,

      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        wallet_address: wallet.walletAddress,
        chain: wallet.chain,
        is_primary: wallet.isPrimary,
        verified_at: wallet.verifiedAt,
        created_at: wallet.createdAt,
      })),

      needs_profile_setup: !profile?.username || !profile?.displayName,
      needs_onboarding: !learnerProfile?.onboardingCompleted,
    };
  }
}