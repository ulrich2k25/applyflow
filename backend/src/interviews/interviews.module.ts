import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InterviewsOverviewController } from './interviews-overview.controller';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

@Module({
  imports: [PrismaModule, AuthModule, ApplicationsModule],
  controllers: [InterviewsController, InterviewsOverviewController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}
