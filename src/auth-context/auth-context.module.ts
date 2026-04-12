import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AuthContextController } from './auth.controller';
import { SupabaseAuthService } from './services/supabase-auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuthContextController],
  providers: [SupabaseAuthService, SupabaseAuthGuard],
  exports: [SupabaseAuthService, SupabaseAuthGuard],
})
export class AuthContextModule {}