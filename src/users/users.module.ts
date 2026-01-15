import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma.module';
import { ConfigModule } from '@nestjs/config';
import { MinioModule } from '../storage/minio.module';

@Module({
  imports: [PrismaModule, ConfigModule, MinioModule],
  controllers: [UsersController, AdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
