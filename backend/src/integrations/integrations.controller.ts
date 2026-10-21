import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { ImportJobApplicationDto } from './dto/import-job-application.dto';
import { IntegrationApiKeyGuard } from './integration-api-key.guard';
import { IntegrationsService } from './integrations.service';

type IntegrationRequest = Request & {
  integrationUserId?: string;
};

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('api-keys')
  @UseGuards(AuthGuard('jwt'))
  createApiKey(
    @CurrentUser() user: AuthenticatedUser,
    @Body('name') name?: string,
  ) {
    return this.integrationsService.createApiKey(user.userId, name);
  }

  @Post('applications/import')
  @UseGuards(IntegrationApiKeyGuard)
  importApplication(
    @Req() request: IntegrationRequest,
    @Body() dto: ImportJobApplicationDto,
  ) {
    if (!request.integrationUserId) {
      throw new UnauthorizedException('Intégration non authentifiée.');
    }

    return this.integrationsService.importApplication(
      request.integrationUserId,
      dto,
    );
  }
}
