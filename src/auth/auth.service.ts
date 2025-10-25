import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private users: UsersService) {}

  async register(email: string, password: string, displayName?: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new BadRequestException('Email already registered');
    const hash = await argon2.hash(password);
    const user = await this.users.createWithPassword(email, hash, displayName);
    return { userId: user.id, email: user.email };
  }

  async validateLogin(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return { userId: user.id, email: user.email };
  }
}
