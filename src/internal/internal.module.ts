import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { InternalProfileService } from './internal-profile.service';
import { InternalGuard } from './internal.guard';

@Module({
  controllers: [InternalController],
  providers: [InternalProfileService, InternalGuard],
})
export class InternalModule {}