import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { InterviewsService } from './interviews.service';

@UseGuards(AuthGuard('jwt'))
@Controller('interviews')
export class InterviewsOverviewController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.interviewsService.findAllForUser(user.userId);
  }
}
