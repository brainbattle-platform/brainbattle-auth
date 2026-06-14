import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LinkWalletDto } from './dto/link-wallet.dto';

function normalizeWalletAddress(value: string) {
  const walletAddress = value.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new BadRequestException('Invalid EVM wallet address');
  }

  // Store lower-case to prevent duplicate rows caused by checksum/case variants.
  return walletAddress.toLowerCase();
}

function normalizeChain(dto: LinkWalletDto) {
  return (dto.chain ?? dto.walletProvider ?? 'LOCAL_HARDHAT').trim().toUpperCase();
}

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string) {
    const wallets = await this.prisma.walletLink.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    const primaryWallet = wallets.find((wallet) => wallet.isPrimary) ?? wallets[0] ?? null;

    return {
      userId,
      primaryWallet: primaryWallet
        ? {
            id: primaryWallet.id,
            walletAddress: primaryWallet.walletAddress,
            address: primaryWallet.walletAddress,
            chain: primaryWallet.chain,
            isPrimary: primaryWallet.isPrimary,
            verifiedAt: primaryWallet.verifiedAt?.toISOString() ?? null,
            createdAt: primaryWallet.createdAt.toISOString(),
          }
        : null,
      walletAddress: primaryWallet?.walletAddress ?? null,
      walletProvider: primaryWallet?.chain ?? null,
      walletVerifiedAt: primaryWallet?.verifiedAt?.toISOString() ?? null,
      walletCount: wallets.length,
      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        walletAddress: wallet.walletAddress,
        address: wallet.walletAddress,
        chain: wallet.chain,
        isPrimary: wallet.isPrimary,
        verifiedAt: wallet.verifiedAt?.toISOString() ?? null,
        createdAt: wallet.createdAt.toISOString(),
      })),
    };
  }

  async linkMine(userId: string, dto: LinkWalletDto) {
    const existingUser = await this.prisma.authUser.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Auth user not found');
    }

    const walletAddress = normalizeWalletAddress(dto.walletAddress);
    const chain = normalizeChain(dto);
    const verifiedAt = new Date();

    const walletOwnedByAnotherUser = await this.prisma.walletLink.findFirst({
      where: {
        walletAddress,
        chain,
        userId: { not: userId },
      },
      select: { userId: true },
    });

    if (walletOwnedByAnotherUser) {
      throw new BadRequestException(
        'This wallet is already linked to another BrainBattle account',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.walletLink.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });

      const wallet = await tx.walletLink.upsert({
        where: {
          userId_walletAddress_chain: {
            userId,
            walletAddress,
            chain,
          },
        },
        update: {
          isPrimary: true,
          verifiedAt,
        },
        create: {
          userId,
          walletAddress,
          chain,
          isPrimary: true,
          verifiedAt,
        },
      });

      const learnerProfile = await tx.learnerProfile.upsert({
        where: { userId },
        update: {
          walletAddress,
          walletProvider: chain,
          walletVerifiedAt: verifiedAt,
        },
        create: {
          userId,
          walletAddress,
          walletProvider: chain,
          walletVerifiedAt: verifiedAt,
        },
      });

      await tx.userAuditEvent.create({
        data: {
          userId,
          eventType: 'wallet.primary_linked',
          payload: { walletAddress, chain },
        },
      });

      return { wallet, learnerProfile };
    });

    return {
      userId,
      primaryWallet: {
        id: result.wallet.id,
        walletAddress: result.wallet.walletAddress,
        address: result.wallet.walletAddress,
        chain: result.wallet.chain,
        isPrimary: result.wallet.isPrimary,
        verifiedAt: result.wallet.verifiedAt?.toISOString() ?? null,
      },
      wallet: {
        id: result.wallet.id,
        walletAddress: result.wallet.walletAddress,
        address: result.wallet.walletAddress,
        chain: result.wallet.chain,
        isPrimary: result.wallet.isPrimary,
        verifiedAt: result.wallet.verifiedAt?.toISOString() ?? null,
      },
      learnerProfile: {
        walletAddress: result.learnerProfile.walletAddress,
        walletProvider: result.learnerProfile.walletProvider,
        walletVerifiedAt: result.learnerProfile.walletVerifiedAt?.toISOString() ?? null,
      },
    };
  }
}
