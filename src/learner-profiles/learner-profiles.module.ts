import { Module } from '@nestjs/common';
import { LearnerProfilesController } from './learner-profiles.controller';
import { LearnerProfilesService } from './learner-profiles.service';
import { AuthContextModule } from '../auth-context/auth-context.module';

@Module({
  imports: [AuthContextModule],
  controllers: [LearnerProfilesController],
  providers: [LearnerProfilesService],
  exports: [LearnerProfilesService],
})
export class LearnerProfilesModule {}