import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from '../companies/companies.service';
import { ApplicationStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationsService } from './applications.service';
import { QueryApplicationsDto } from './dto/query-applications.dto';

describe('ApplicationsService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const companyId = '22222222-2222-4222-8222-222222222222';
  const applicationId = '33333333-3333-4333-8333-333333333333';

  const applicationRepository = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const statusHistoryRepository = {
    create: jest.fn(),
  };

  const transactionMock = jest.fn();

  const prisma = {
    application: applicationRepository,
    applicationStatusHistory: statusHistoryRepository,
    $transaction: transactionMock,
  } as unknown as PrismaService;

  const companiesService = {
    findOne: jest.fn(),
  } as unknown as CompaniesService;

  let service: ApplicationsService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ApplicationsService(prisma, companiesService);
  });

  it('filters applications by authenticated user', async () => {
    const query = new QueryApplicationsDto();

    applicationRepository.findMany.mockResolvedValue([]);
    applicationRepository.count.mockResolvedValue(0);
    transactionMock.mockResolvedValue([[], 0]);

    await service.findAll(userId, query);

    expect(applicationRepository.findMany).toHaveBeenCalledWith({
      where: {
        userId,
        archivedAt: null,
        status: undefined,
        priority: undefined,
        companyId: undefined,
      },
      skip: 0,
      take: 20,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        company: true,
      },
    });

    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it('checks application id and user id together', async () => {
    applicationRepository.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, applicationId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(applicationRepository.findFirst).toHaveBeenCalledWith({
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
  });

  it('refuses an application for an archived company', async () => {
    const findCompany = jest
      .spyOn(companiesService, 'findOne')
      .mockResolvedValue({
        archivedAt: new Date(),
      } as never);

    await expect(
      service.create(userId, {
        companyId,
        jobTitle: 'Software Engineer',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(findCompany).toHaveBeenCalledWith(userId, companyId);

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('requires a currency when a salary is provided', async () => {
    jest.spyOn(companiesService, 'findOne').mockResolvedValue({
      archivedAt: null,
    } as never);

    await expect(
      service.create(userId, {
        companyId,
        jobTitle: 'Software Engineer',
        salaryMin: 50000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('rejects ARCHIVED as a regular status update', async () => {
    applicationRepository.findFirst.mockResolvedValue({
      id: applicationId,
      userId,
      status: ApplicationStatus.APPLIED,
      salaryMin: null,
      salaryMax: null,
      currency: null,
      appliedAt: new Date(),
      archivedAt: null,
      company: {},
      statusHistory: [],
      interviews: [],
      notes: [],
      documents: [],
    });

    await expect(
      service.update(userId, applicationId, {
        status: ApplicationStatus.ARCHIVED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transactionMock).not.toHaveBeenCalled();
  });
});
