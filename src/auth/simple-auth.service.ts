import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SimpleAuthService {
  private readonly saltRounds = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sign up a new user with username/password
   */
  async signup(username: string, password: string, displayName?: string) {
    // Check if username already exists
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new BadRequestException('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    // Create user
    // Email is required in schema, so we set it to username@local
    const email = `${username}@local`;
    
    // Check if email already exists (unlikely but possible)
    const emailExists = await this.prisma.user.findUnique({
      where: { email },
    });
    
    if (emailExists) {
      throw new BadRequestException('Email already registered');
    }

    // Simple auth always requires username and passwordHash
    const user = await this.prisma.user.create({
      data: {
        username, // Required for simple auth
        email,
        passwordHash, // Required for simple auth
        displayName: displayName || username,
        status: 'ACTIVE',
        role: 'USER',
        rankCode: 'BRONZE',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        // Exclude passwordHash and other sensitive fields
      },
    });

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    };
  }

  /**
   * Login with username/password
   */
  async login(username: string, password: string) {
    // Find user by username
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Check if user has passwordHash (simple auth users only)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Check if user is banned
    if (user.status === 'BANNED') {
      throw new ForbiddenException('Account is banned');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    };
  }
}

