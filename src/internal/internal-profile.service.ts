import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { env } from '../common/env';
import { RankSyncDto } from './dto/rank-sync.dto';
import { WalletSyncDto } from './dto/wallet-sync.dto';

@Injectable()
export class InternalProfileService {
  private readonly supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  async syncRank(dto: RankSyncDto) {
    const { data, error } = await this.supabase
      .from('learner_profiles')
      .update({
        rank_tier: dto.rankTier,
        rank_stars: dto.stars,
        season_id: dto.seasonId,
        win_count: dto.winCount,
        draw_count: dto.drawCount,
        lose_count: dto.loseCount,
        total_battles: dto.totalBattles,
        brain_point_balance: dto.brainPointBalance,
      })
      .eq('user_id', dto.userId)
      .select('*')
      .single();

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  async syncWallet(dto: WalletSyncDto) {
    const { data, error } = await this.supabase
      .from('learner_profiles')
      .update({
        wallet_address: dto.walletAddress,
        wallet_provider: dto.walletProvider ?? 'external',
        wallet_verified_at: new Date().toISOString(),
      })
      .eq('user_id', dto.userId)
      .select('*')
      .single();

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  async getWallet(userId: string) {
    const { data, error } = await this.supabase
      .from('learner_profiles')
      .select('user_id,wallet_address,wallet_verified_at,wallet_provider')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Learner profile not found');
    }

    return {
      userId: data.user_id,
      walletAddress: data.wallet_address,
      walletVerifiedAt: data.wallet_verified_at,
      walletProvider: data.wallet_provider,
    };
  }
}