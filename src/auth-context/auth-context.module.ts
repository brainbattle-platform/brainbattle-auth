import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AuthContextController } from './auth.controller';
import { SupabaseAuthService } from './services/supabase-auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthContextService } from './auth-context.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthContextController],
  providers: [
    AuthContextService,
    SupabaseAuthService,
    SupabaseAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthContextService,
    SupabaseAuthService,
    SupabaseAuthGuard,
    RolesGuard,
  ],
})
export class AuthContextModule {}