import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompaniesService } from '../companies/companies.service';
import type { Prisma } from '../generated/prisma/client';
import { ApplicationStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import {
  ApplicationSortBy,
  QueryApplicationsDto,
  SortOrder,
} from './dto/query-applications.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(userId: string, dto: CreateApplicationDto) {
    const company = await this.companiesService.findOne(userId, dto.companyId);

    if (company.archivedAt !== null) {
      throw new BadRequestException(
        'Impossible de créer une candidature pour une entreprise archivée.',
      );
    }

    this.validateSalary(dto.salaryMin, dto.salaryMax, dto.currency);

    const {
      deadline,
      appliedAt,
      status = ApplicationStatus.SAVED,
      ...applicationData
    } = dto;

    const effectiveAppliedAt =
      appliedAt !== undefined
        ? new Date(appliedAt)
        : status === ApplicationStatus.APPLIED
          ? new Date()
          : undefined;

    return this.prisma.$transaction(async (transaction) => {
      const application = await transaction.application.create({
        data: {
          ...applicationData,
          userId,
          status,
          deadline: deadline !== undefined ? new Date(deadline) : undefined,
          appliedAt: effectiveAppliedAt,
        },
        include: {
          company: true,
        },
      });

      await transaction.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: status,
        },
      });

      return application;
    });
  }

  async findAll(userId: string, query: QueryApplicationsDto) {
    const where: Prisma.ApplicationWhereInput = {
      userId,
      archivedAt: null,
      status: query.status,
      priority: query.priority,
      companyId: query.companyId,
      ...(query.search !== undefined
        ? {
            OR: [
              {
                jobTitle: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                location: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                company: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const orderBy = this.buildOrderBy(query);

    const [applications, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: {
          company: true,
        },
      }),
      this.prisma.application.count({
        where,
      }),
    ]);

    return {
      data: applications,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(userId: string, applicationId: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        userId,
      },
      include: {
        company: true,
        statusHistory: {
          orderBy: {
            changedAt: 'desc',
          },
        },
        interviews: {
          orderBy: {
            scheduledAt: 'asc',
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        documents: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable.');
    }

    return application;
  }

  async update(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationDto,
  ) {
    const currentApplication = await this.findOne(userId, applicationId);

    if (dto.status === ApplicationStatus.ARCHIVED) {
      throw new BadRequestException(
        'Utilisez la route d’archivage pour archiver une candidature.',
      );
    }

    const salaryMin =
      dto.salaryMin ??
      (currentApplication.salaryMin === null
        ? undefined
        : Number(currentApplication.salaryMin));

    const salaryMax =
      dto.salaryMax ??
      (currentApplication.salaryMax === null
        ? undefined
        : Number(currentApplication.salaryMax));

    const currency = dto.currency ?? currentApplication.currency ?? undefined;

    this.validateSalary(salaryMin, salaryMax, currency);

    const { deadline, appliedAt, ...applicationData } = dto;

    const statusChanged =
      dto.status !== undefined && dto.status !== currentApplication.status;

    const effectiveAppliedAt =
      appliedAt !== undefined
        ? new Date(appliedAt)
        : dto.status === ApplicationStatus.APPLIED &&
            currentApplication.appliedAt === null
          ? new Date()
          : undefined;

    return this.prisma.$transaction(async (transaction) => {
      const application = await transaction.application.update({
        where: {
          id: applicationId,
        },
        data: {
          ...applicationData,
          deadline: deadline !== undefined ? new Date(deadline) : undefined,
          appliedAt: effectiveAppliedAt,
        },
        include: {
          company: true,
        },
      });

      if (statusChanged && dto.status !== undefined) {
        await transaction.applicationStatusHistory.create({
          data: {
            applicationId,
            fromStatus: currentApplication.status,
            toStatus: dto.status,
          },
        });
      }

      return application;
    });
  }

  async archive(userId: string, applicationId: string) {
    const currentApplication = await this.findOne(userId, applicationId);

    if (currentApplication.archivedAt !== null) {
      return currentApplication;
    }

    return this.prisma.$transaction(async (transaction) => {
      const application = await transaction.application.update({
        where: {
          id: applicationId,
        },
        data: {
          status: ApplicationStatus.ARCHIVED,
          archivedAt: new Date(),
        },
        include: {
          company: true,
        },
      });

      if (currentApplication.status !== ApplicationStatus.ARCHIVED) {
        await transaction.applicationStatusHistory.create({
          data: {
            applicationId,
            fromStatus: currentApplication.status,
            toStatus: ApplicationStatus.ARCHIVED,
          },
        });
      }

      return application;
    });
  }

  private buildOrderBy(
    query: QueryApplicationsDto,
  ): Prisma.ApplicationOrderByWithRelationInput {
    const direction = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    switch (query.sortBy) {
      case ApplicationSortBy.CREATED_AT:
        return {
          createdAt: direction,
        };

      case ApplicationSortBy.DEADLINE:
        return {
          deadline: direction,
        };

      case ApplicationSortBy.UPDATED_AT:
      default:
        return {
          updatedAt: direction,
        };
    }
  }

  private validateSalary(
    salaryMin?: number,
    salaryMax?: number,
    currency?: string,
  ): void {
    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMax < salaryMin
    ) {
      throw new BadRequestException(
        'Le salaire maximum doit être supérieur ou égal au salaire minimum.',
      );
    }

    if (
      (salaryMin !== undefined || salaryMax !== undefined) &&
      currency === undefined
    ) {
      throw new BadRequestException(
        'La devise est obligatoire lorsqu’un salaire est renseigné.',
      );
    }
  }
}
