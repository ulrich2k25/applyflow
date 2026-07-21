import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const applicationId = '22222222-2222-4222-8222-222222222222';
  const noteId = '33333333-3333-4333-8333-333333333333';

  const noteRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const prisma = {
    note: noteRepository,
  } as unknown as PrismaService;

  const findApplicationMock = jest.fn();

  const applicationsService = {
    findOne: findApplicationMock,
  } as unknown as ApplicationsService;

  let service: NotesService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new NotesService(prisma, applicationsService);
  });

  it('checks the application owner before listing notes', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: null,
    });

    noteRepository.findMany.mockResolvedValue([]);

    await service.findAll(userId, applicationId);

    expect(findApplicationMock).toHaveBeenCalledWith(userId, applicationId);

    expect(noteRepository.findMany).toHaveBeenCalledWith({
      where: {
        applicationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('refuses a note for an archived application', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: new Date(),
    });

    await expect(
      service.create(userId, applicationId, {
        content: 'Note de test',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(noteRepository.create).not.toHaveBeenCalled();
  });

  it('checks note id and application id together', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: null,
    });

    noteRepository.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(userId, applicationId, noteId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(noteRepository.findFirst).toHaveBeenCalledWith({
      where: {
        id: noteId,
        applicationId,
      },
    });
  });

  it('deletes only the verified note', async () => {
    findApplicationMock.mockResolvedValue({
      archivedAt: null,
    });

    noteRepository.findFirst.mockResolvedValue({
      id: noteId,
      applicationId,
      content: 'Note de test',
    });

    noteRepository.delete.mockResolvedValue({
      id: noteId,
      applicationId,
      content: 'Note de test',
    });

    await service.remove(userId, applicationId, noteId);

    expect(noteRepository.delete).toHaveBeenCalledWith({
      where: {
        id: noteId,
      },
    });
  });
});
