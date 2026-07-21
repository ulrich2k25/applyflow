import { Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  InterviewStatus,
  Priority,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const now = new Date();

    const [
      totalApplications,
      totalCompanies,
      totalDocuments,
      upcomingInterviewsCount,
      applicationStatuses,
      applicationPriorities,
      recentApplications,
      upcomingInterviews,
    ] = await this.prisma.$transaction([
      this.prisma.application.count({
        where: {
          userId,
          archivedAt: null,
        },
      }),
      this.prisma.company.count({
        where: {
          userId,
          archivedAt: null,
        },
      }),
      this.prisma.document.count({
        where: {
          userId,
        },
      }),
      this.prisma.interview.count({
        where: {
          scheduledAt: {
            gte: now,
          },
          status: {
            in: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED],
          },
          application: {
            userId,
            archivedAt: null,
          },
        },
      }),
      this.prisma.application.findMany({
        where: {
          userId,
          archivedAt: null,
        },
        select: {
          status: true,
        },
      }),
      this.prisma.application.findMany({
        where: {
          userId,
          archivedAt: null,
        },
        select: {
          priority: true,
        },
      }),
      this.prisma.application.findMany({
        where: {
          userId,
          archivedAt: null,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          jobTitle: true,
          status: true,
          priority: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.interview.findMany({
        where: {
          scheduledAt: {
            gte: now,
          },
          status: {
            in: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED],
          },
          application: {
            userId,
            archivedAt: null,
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: 5,
        select: {
          id: true,
          type: true,
          status: true,
          scheduledAt: true,
          durationMinutes: true,
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
      }),
    ]);

    const applicationsByStatus: Record<ApplicationStatus, number> = {
      SAVED: 0,
      PREPARING: 0,
      APPLIED: 0,
      IN_REVIEW: 0,
      INTERVIEW: 0,
      OFFER: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
      ARCHIVED: 0,
    };

    for (const application of applicationStatuses) {
      applicationsByStatus[application.status] += 1;
    }

    const applicationsByPriority: Record<Priority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    for (const application of applicationPriorities) {
      applicationsByPriority[application.priority] += 1;
    }

    return {
      summary: {
        totalApplications,
        totalCompanies,
        totalDocuments,
        upcomingInterviews: upcomingInterviewsCount,
      },
      applicationsByStatus,
      applicationsByPriority,
      recentApplications,
      upcomingInterviews,
      generatedAt: now,
    };
  }
}
