import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { InterviewStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async findAllForUser(userId: string) {
    return this.prisma.interview.findMany({
      where: {
        application: {
          userId,
          archivedAt: null,
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      include: {
        application: {
          select: {
            id: true,
            jobTitle: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async create(userId: string, applicationId: string, dto: CreateInterviewDto) {
    await this.ensureActiveApplication(userId, applicationId);

    const {
      scheduledAt,
      status = InterviewStatus.SCHEDULED,
      ...interviewData
    } = dto;

    return this.prisma.interview.create({
      data: {
        ...interviewData,
        applicationId,
        status,
        scheduledAt: new Date(scheduledAt),
      },
    });
  }

  async findAll(userId: string, applicationId: string) {
    await this.applicationsService.findOne(userId, applicationId);

    return this.prisma.interview.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  async findOne(userId: string, applicationId: string, interviewId: string) {
    await this.applicationsService.findOne(userId, applicationId);

    return this.findInterview(applicationId, interviewId);
  }

  async update(
    userId: string,
    applicationId: string,
    interviewId: string,
    dto: UpdateInterviewDto,
  ) {
    await this.ensureActiveApplication(userId, applicationId);

    await this.findInterview(applicationId, interviewId);

    const { scheduledAt, ...interviewData } = dto;

    return this.prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        ...interviewData,
        scheduledAt:
          scheduledAt !== undefined ? new Date(scheduledAt) : undefined,
      },
    });
  }

  async cancel(userId: string, applicationId: string, interviewId: string) {
    await this.ensureActiveApplication(userId, applicationId);

    const interview = await this.findInterview(applicationId, interviewId);

    if (interview.status === InterviewStatus.CANCELLED) {
      return interview;
    }

    return this.prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
        status: InterviewStatus.CANCELLED,
      },
    });
  }

  private async ensureActiveApplication(userId: string, applicationId: string) {
    const application = await this.applicationsService.findOne(
      userId,
      applicationId,
    );

    if (application.archivedAt !== null) {
      throw new BadRequestException(
        'Impossible de modifier les entretiens d’une candidature archivée.',
      );
    }

    return application;
  }

  private async findInterview(applicationId: string, interviewId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        applicationId,
      },
    });

    if (!interview) {
      throw new NotFoundException('Entretien introuvable.');
    }

    return interview;
  }
}
