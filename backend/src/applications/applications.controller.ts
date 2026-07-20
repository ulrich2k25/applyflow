import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(user.userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryApplicationsDto,
  ) {
    return this.applicationsService.findAll(user.userId, query);
  }

  @Get(':applicationId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
  ) {
    return this.applicationsService.findOne(user.userId, applicationId);
  }

  @Patch(':applicationId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(user.userId, applicationId, dto);
  }

  @Delete(':applicationId')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
  ) {
    return this.applicationsService.archive(user.userId, applicationId);
  }
}
