import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma.module';
import { AuthContextModule } from './auth-context/auth-context.module';
import { ProfilesModule } from './profiles/profiles.module';
import { LearnerProfilesModule } from './learner-profiles/learner-profiles.module';
import { RolesModule } from './roles/roles.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { WalletsModule } from './wallets/wallets.module';
import { InternalModule } from './internal/internal.module';
@Module({
  imports: [
    PrismaModule,
    AuthContextModule,
    ProfilesModule,
    LearnerProfilesModule,
    RolesModule,
    AdminUsersModule,
    WalletsModule,
    InternalModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}