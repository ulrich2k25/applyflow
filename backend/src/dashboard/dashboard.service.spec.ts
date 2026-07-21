import {
  ApplicationStatus,
  InterviewStatus,
  Priority,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';

  const applicationRepository = {
    count: jest.fn(),
    findMany: jest.fn(),
  };

  const companyRepository = {
    count: jest.fn(),
  };

  const documentRepository = {
    count: jest.fn(),
  };

  const interviewRepository = {
    count: jest.fn(),
    findMany: jest.fn(),
  };

  const transactionMock = jest.fn();

  const prisma = {
    application: applicationRepository,
    company: companyRepository,
    document: documentRepository,
    interview: interviewRepository,
    $transaction: transactionMock,
  } as unknown as PrismaService;

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new DashboardService(prisma);
  });

  it('builds an overview for the authenticated user', async () => {
    const recentApplications = [
      {
        id: 'application-1',
        jobTitle: 'Software Engineer',
        status: ApplicationStatus.INTERVIEW,
        priority: Priority.HIGH,
        updatedAt: new Date(),
        company: {
          id: 'company-1',
          name: 'ApplyFlow',
        },
      },
    ];

    const upcomingInterviews = [
      {
        id: 'interview-1',
        type: 'VIDEO',
        status: InterviewStatus.SCHEDULED,
        scheduledAt: new Date(),
        durationMinutes: 60,
        application: {
          id: 'application-1',
          jobTitle: 'Software Engineer',
          company: {
            id: 'company-1',
            name: 'ApplyFlow',
          },
        },
      },
    ];

    transactionMock.mockResolvedValue([
      3,
      2,
      1,
      1,
      [
        {
          status: ApplicationStatus.APPLIED,
        },
        {
          status: ApplicationStatus.INTERVIEW,
        },
        {
          status: ApplicationStatus.INTERVIEW,
        },
      ],
      [
        {
          priority: Priority.MEDIUM,
        },
        {
          priority: Priority.HIGH,
        },
        {
          priority: Priority.HIGH,
        },
      ],
      recentApplications,
      upcomingInterviews,
    ]);

    const result = await service.getOverview(userId);

    expect(result.summary).toEqual({
      totalApplications: 3,
      totalCompanies: 2,
      totalDocuments: 1,
      upcomingInterviews: 1,
    });

    expect(result.applicationsByStatus).toEqual({
      SAVED: 0,
      PREPARING: 0,
      APPLIED: 1,
      IN_REVIEW: 0,
      INTERVIEW: 2,
      OFFER: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
      ARCHIVED: 0,
    });

    expect(result.applicationsByPriority).toEqual({
      LOW: 0,
      MEDIUM: 1,
      HIGH: 2,
    });

    expect(result.recentApplications).toBe(recentApplications);

    expect(result.upcomingInterviews).toBe(upcomingInterviews);
  });

  it('filters main totals by authenticated user', async () => {
    transactionMock.mockResolvedValue([0, 0, 0, 0, [], [], [], []]);

    await service.getOverview(userId);

    expect(applicationRepository.count).toHaveBeenCalledWith({
      where: {
        userId,
        archivedAt: null,
      },
    });

    expect(companyRepository.count).toHaveBeenCalledWith({
      where: {
        userId,
        archivedAt: null,
      },
    });

    expect(documentRepository.count).toHaveBeenCalledWith({
      where: {
        userId,
      },
    });
  });
});
