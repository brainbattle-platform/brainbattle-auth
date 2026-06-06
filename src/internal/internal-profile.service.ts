import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RankSyncDto } from './dto/rank-sync.dto';
import { WalletSyncDto } from './dto/wallet-sync.dto';

@Injectable()
export class InternalProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async syncRank(dto: RankSyncDto) {
    const existingUser = await this.prisma.authUser.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Auth user not found');
    }

    const learnerProfile = await this.prisma.learnerProfile.upsert({
      where: { userId: dto.userId },
      update: {
        rankTier: dto.rankTier,
        rankStars: dto.stars,
        seasonId: dto.seasonId ?? null,
        winCount: dto.winCount,
        drawCount: dto.drawCount,
        loseCount: dto.loseCount,
        totalBattles: dto.totalBattles,
        brainPointBalance: dto.brainPointBalance,
      },
      create: {
        userId: dto.userId,
        rankTier: dto.rankTier,
        rankStars: dto.stars,
        seasonId: dto.seasonId ?? null,
        winCount: dto.winCount,
        drawCount: dto.drawCount,
        loseCount: dto.loseCount,
        totalBattles: dto.totalBattles,
        brainPointBalance: dto.brainPointBalance,
      },
    });

    await this.prisma.userAuditEvent.create({
      data: {
        userId: dto.userId,
        eventType: 'battle.rank_synced',
        payload: {
          rankTier: dto.rankTier,
          stars: dto.stars,
          seasonId: dto.seasonId ?? null,
          winCount: dto.winCount,
          drawCount: dto.drawCount,
          loseCount: dto.loseCount,
          totalBattles: dto.totalBattles,
          brainPointBalance: dto.brainPointBalance,
        },
      },
    });

    return {
      userId: learnerProfile.userId,
      rank: {
        tier: learnerProfile.rankTier ?? 'BRONZE',
        stars: learnerProfile.rankStars ?? 0,
        seasonId: learnerProfile.seasonId,
        winCount: learnerProfile.winCount ?? 0,
        drawCount: learnerProfile.drawCount ?? 0,
        loseCount: learnerProfile.loseCount ?? 0,
        totalBattles: learnerProfile.totalBattles ?? 0,
      },
      brainPointBalance: learnerProfile.brainPointBalance ?? 0,
      syncedAt: new Date().toISOString(),
    };
  }

  async syncWallet(dto: WalletSyncDto) {
    const existingUser = await this.prisma.authUser.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Auth user not found');
    }

    const chain = dto.walletProvider ?? 'external';
    const verifiedAt = new Date();

    const learnerProfile = await this.prisma.$transaction(async (tx) => {
      await tx.walletLink.updateMany({
        where: {
          userId: dto.userId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      await tx.walletLink.upsert({
        where: {
          userId_walletAddress_chain: {
            userId: dto.userId,
            walletAddress: dto.walletAddress,
            chain,
          },
        },
        update: {
          isPrimary: true,
          verifiedAt,
        },
        create: {
          userId: dto.userId,
          walletAddress: dto.walletAddress,
          chain,
          isPrimary: true,
          verifiedAt,
        },
      });

      const profile = await tx.learnerProfile.upsert({
        where: { userId: dto.userId },
        update: {
          walletAddress: dto.walletAddress,
          walletProvider: chain,
          walletVerifiedAt: verifiedAt,
        },
        create: {
          userId: dto.userId,
          walletAddress: dto.walletAddress,
          walletProvider: chain,
          walletVerifiedAt: verifiedAt,
        },
      });

      await tx.userAuditEvent.create({
        data: {
          userId: dto.userId,
          eventType: 'wallet.synced',
          payload: {
            walletAddress: dto.walletAddress,
            walletProvider: chain,
          },
        },
      });

      return profile;
    });

    return {
      userId: learnerProfile.userId,
      wallet: {
        address: learnerProfile.walletAddress,
        provider: learnerProfile.walletProvider,
        verifiedAt: learnerProfile.walletVerifiedAt?.toISOString() ?? null,
      },
    };
  }

  async getWallet(userId: string) {
    const learnerProfile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
      select: {
        userId: true,
        walletAddress: true,
        walletVerifiedAt: true,
        walletProvider: true,
      },
    });

    if (!learnerProfile) {
      throw new NotFoundException('Learner profile not found');
    }

    return {
      userId: learnerProfile.userId,
      walletAddress: learnerProfile.walletAddress,
      walletVerifiedAt: learnerProfile.walletVerifiedAt?.toISOString() ?? null,
      walletProvider: learnerProfile.walletProvider,
    };
  }

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const learnerProfile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
      select: {
        onboardingCompleted: true,
        goalType: true,
        currentLevel: true,
        targetLevel: true,
        nativeLanguage: true,
        targetLanguage: true,
        focusSkills: true,
        weakSkills: true,
        rankTier: true,
        rankStars: true,
        seasonId: true,
        winCount: true,
        drawCount: true,
        loseCount: true,
        totalBattles: true,
        brainPointBalance: true,
        walletAddress: true,
        walletProvider: true,
        walletVerifiedAt: true,
      },
    });

    return {
      userId: profile.id,
      email: profile.email,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      status: profile.status,
      learner: {
        onboardingCompleted: learnerProfile?.onboardingCompleted ?? false,
        goalType: learnerProfile?.goalType ?? null,
        currentLevel: learnerProfile?.currentLevel ?? null,
        targetLevel: learnerProfile?.targetLevel ?? null,
        nativeLanguage: learnerProfile?.nativeLanguage ?? null,
        targetLanguage: learnerProfile?.targetLanguage ?? null,
        focusSkills: learnerProfile?.focusSkills ?? null,
        weakSkills: learnerProfile?.weakSkills ?? null,
      },
      rank: {
        tier: learnerProfile?.rankTier ?? 'BRONZE',
        stars: learnerProfile?.rankStars ?? 0,
        seasonId: learnerProfile?.seasonId ?? null,
        winCount: learnerProfile?.winCount ?? 0,
        drawCount: learnerProfile?.drawCount ?? 0,
        loseCount: learnerProfile?.loseCount ?? 0,
        totalBattles: learnerProfile?.totalBattles ?? 0,
      },
      wallet: {
        address: learnerProfile?.walletAddress ?? null,
        provider: learnerProfile?.walletProvider ?? null,
        verifiedAt: learnerProfile?.walletVerifiedAt?.toISOString() ?? null,
      },
      brainPointBalance: learnerProfile?.brainPointBalance ?? 0,
    };
  }
}