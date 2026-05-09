import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { AuthContextModule } from '../auth-context/auth-context.module';

@Module({
  imports: [PrismaModule, AuthContextModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}