import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { CompaniesModule } from '../companies/companies.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationApiKeyGuard } from './integration-api-key.guard';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [PrismaModule, CompaniesModule, ApplicationsModule],
  providers: [IntegrationsService, IntegrationApiKeyGuard],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
