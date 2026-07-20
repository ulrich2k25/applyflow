import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { InterviewsService } from './interviews.service';

@UseGuards(AuthGuard('jwt'))
@Controller('applications/:applicationId/interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(user.userId, applicationId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
  ) {
    return this.interviewsService.findAll(user.userId, applicationId);
  }

  @Get(':interviewId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Param('interviewId', ParseUUIDPipe)
    interviewId: string,
  ) {
    return this.interviewsService.findOne(
      user.userId,
      applicationId,
      interviewId,
    );
  }

  @Patch(':interviewId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Param('interviewId', ParseUUIDPipe)
    interviewId: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(
      user.userId,
      applicationId,
      interviewId,
      dto,
    );
  }

  @Delete(':interviewId')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Param('interviewId', ParseUUIDPipe)
    interviewId: string,
  ) {
    return this.interviewsService.cancel(
      user.userId,
      applicationId,
      interviewId,
    );
  }
}
