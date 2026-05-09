import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  getMine(userId: string) {
    return this.prisma.walletLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}