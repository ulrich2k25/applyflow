import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const companyId = '22222222-2222-4222-8222-222222222222';

  const companyRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };

  const prisma = {
    company: companyRepository,
  } as unknown as PrismaService;

  let service: CompaniesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CompaniesService(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('filters active companies by authenticated user', async () => {
    companyRepository.findMany.mockResolvedValue([]);

    await service.findAll(userId);

    expect(companyRepository.findMany).toHaveBeenCalledWith({
      where: {
        userId,
        archivedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  });

  it('checks both company id and user id', async () => {
    companyRepository.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, companyId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(companyRepository.findFirst).toHaveBeenCalledWith({
      where: {
        id: companyId,
        userId,
      },
    });
  });

  it('archives a company instead of deleting it', async () => {
    const archivedAt = new Date('2026-07-20T21:28:01.000Z');

    jest.useFakeTimers({
      now: archivedAt,
    });

    companyRepository.findFirst.mockResolvedValue({
      id: companyId,
      userId,
    });

    companyRepository.update.mockResolvedValue({
      id: companyId,
      userId,
      archivedAt,
    });

    await service.archive(userId, companyId);

    expect(companyRepository.update).toHaveBeenCalledWith({
      where: {
        id: companyId,
      },
      data: {
        archivedAt,
      },
    });
  });

  it('returns a conflict when the company name already exists', async () => {
    companyRepository.create.mockRejectedValue({
      code: 'P2002',
    });

    await expect(
      service.create(userId, {
        name: 'SAP',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
