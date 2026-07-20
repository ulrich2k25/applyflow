import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { InterviewStatus, InterviewType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewsService } from './interviews.service';

describe('InterviewsService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const applicationId = '22222222-2222-4222-8222-222222222222';
  const interviewId = '33333333-3333-4333-8333-333333333333';

  const interviewRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };

  const prisma = {
    interview: interviewRepository,
  } as unknown as PrismaService;

  const findApplicationMock = jest.fn();

  const applicationsService = {
    findOne: findApplicationMock,
  } as unknown as ApplicationsService;

  let service: InterviewsService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new InterviewsService(prisma, applicationsService);
  });

  it('checks the application owner before listing interviews', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: null,
    });

    interviewRepository.findMany.mockResolvedValue([]);

    await service.findAll(userId, applicationId);

    expect(findApplicationMock).toHaveBeenCalledWith(userId, applicationId);

    expect(interviewRepository.findMany).toHaveBeenCalledWith({
      where: {
        applicationId,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  });

  it('refuses an interview for an archived application', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: new Date(),
    });

    await expect(
      service.create(userId, applicationId, {
        type: InterviewType.VIDEO,
        scheduledAt: '2026-08-01T10:00:00+02:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(interviewRepository.create).not.toHaveBeenCalled();
  });

  it('checks interview id and application id together', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: null,
    });

    interviewRepository.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(userId, applicationId, interviewId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(interviewRepository.findFirst).toHaveBeenCalledWith({
      where: {
        id: interviewId,
        applicationId,
      },
    });
  });

  it('cancels an interview without deleting it', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: null,
    });

    interviewRepository.findFirst.mockResolvedValue({
      id: interviewId,
      applicationId,
      status: InterviewStatus.SCHEDULED,
    });

    interviewRepository.update.mockResolvedValue({
      id: interviewId,
      applicationId,
      status: InterviewStatus.CANCELLED,
    });

    await service.cancel(userId, applicationId, interviewId);

    expect(interviewRepository.update).toHaveBeenCalledWith({
      where: {
        id: interviewId,
      },
      data: {
        status: InterviewStatus.CANCELLED,
      },
    });
  });
});
