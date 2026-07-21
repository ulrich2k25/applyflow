import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule, AuthModule, ApplicationsModule, StorageModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
