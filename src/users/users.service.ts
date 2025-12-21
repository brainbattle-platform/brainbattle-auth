import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    createWithPassword(email: string, passwordHash: string, displayName?: string, emailVerified?: Date | null) {
        return this.prisma.user.create({ data: { email, passwordHash, displayName, emailVerified } });
    }
    findById(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

}
