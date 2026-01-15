import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

    /**
     * Get user profile (excludes passwordHash)
     */
    async getProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                rankCode: true,
                status: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Exclude: passwordHash, email, emailVerified, sessions, accounts
            },
        });
    }

    /**
     * Update user profile (only displayName and bio)
     * Does not allow updating role, status, or rankCode
     */
    async updateProfile(userId: string, dto: UpdateProfileDto) {
        // Build update data (only include fields that are provided)
        const updateData: { displayName?: string; bio?: string } = {};
        
        if (dto.displayName !== undefined) {
            updateData.displayName = dto.displayName;
        }
        
        if (dto.bio !== undefined) {
            updateData.bio = dto.bio;
        }

        // If no fields to update, return current profile
        if (Object.keys(updateData).length === 0) {
            return this.getProfile(userId);
        }

        // Update and return profile (excludes passwordHash)
        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                rankCode: true,
                status: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Exclude: passwordHash, email, emailVerified, sessions, accounts
            },
        });
    }

    /**
     * Admin: Get user by ID with all fields (except passwordHash)
     */
    async getAdminUser(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                rankCode: true,
                status: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                // Exclude: passwordHash, sessions, accounts
            },
        });
    }

    /**
     * Admin: List users with pagination, search, and filtering
     */
    async listAdminUsers(
        page: number = 1,
        limit: number = 20,
        status?: string,
        search?: string,
    ) {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count and items
        const [total, items] = await Promise.all([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    rankCode: true,
                    status: true,
                    role: true,
                    createdAt: true,
                    // Exclude: passwordHash, email, bio, avatarUrl, emailVerified, updatedAt
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            items,
            total,
            page,
            limit,
        };
    }

    /**
     * Admin: Update user (all fields allowed)
     */
    async updateAdminUser(userId: string, dto: {
        displayName?: string;
        bio?: string;
        rankCode?: string;
        status?: string;
        role?: string;
    }) {
        // Build update data (only include fields that are provided)
        const updateData: any = {};

        if (dto.displayName !== undefined) {
            updateData.displayName = dto.displayName;
        }
        if (dto.bio !== undefined) {
            updateData.bio = dto.bio;
        }
        if (dto.rankCode !== undefined) {
            updateData.rankCode = dto.rankCode;
        }
        if (dto.status !== undefined) {
            updateData.status = dto.status;
        }
        if (dto.role !== undefined) {
            updateData.role = dto.role;
        }

        // If no fields to update, return current user
        if (Object.keys(updateData).length === 0) {
            return this.getAdminUser(userId);
        }

        // Update and return user (excludes passwordHash)
        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                rankCode: true,
                status: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                // Exclude: passwordHash, sessions, accounts
            },
        });
    }

    /**
     * Admin: Soft ban user (set status to BANNED)
     */
    async banUser(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { status: 'BANNED' },
            select: {
                id: true,
                status: true,
            },
        });
    }

    /**
     * Update user avatar URL
     */
    async updateAvatarUrl(userId: string, avatarUrl: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: {
                id: true,
                avatarUrl: true,
            },
        });
    }
}
