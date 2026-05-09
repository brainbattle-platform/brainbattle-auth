import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env';
import { CurrentUser } from '../interfaces/current-user.interface';

@Injectable()
export class SupabaseAuthService {
  private readonly supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

  async verifyAccessToken(token: string): Promise<CurrentUser> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return {
      id: data.user.id,
      email: data.user.email,
      raw: data.user,
    };
  }
}