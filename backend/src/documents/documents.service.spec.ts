import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { DocumentType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const applicationId = '22222222-2222-4222-8222-222222222222';
  const documentId = '33333333-3333-4333-8333-333333333333';
  const storageKey = `${userId}/document.pdf`;

  const documentRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const prisma = {
    document: documentRepository,
  } as unknown as PrismaService;

  const findApplicationMock = jest.fn();

  const applicationsService = {
    findOne: findApplicationMock,
  } as unknown as ApplicationsService;

  const saveFileMock = jest.fn();
  const readFileMock = jest.fn();
  const removeFileMock = jest.fn();

  const storageService = {
    save: saveFileMock,
    read: readFileMock,
    remove: removeFileMock,
  } as unknown as StorageService;

  const file = {
    originalname: 'cv.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('PDF test'),
  } as unknown as Express.Multer.File;

  const storedDocument = {
    id: documentId,
    userId,
    name: 'CV principal',
    type: DocumentType.CV,
    storageKey,
    mimeType: 'application/pdf',
    sizeBytes: BigInt(1024),
    createdAt: new Date(),
    applications: [
      {
        applicationId,
        documentId,
        attachedAt: new Date(),
      },
    ],
  };

  let service: DocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new DocumentsService(prisma, applicationsService, storageService);
  });

  it('stores a document and attaches it to an application', async () => {
    findApplicationMock.mockResolvedValue({
      id: applicationId,
      userId,
      archivedAt: null,
    });

    saveFileMock.mockResolvedValue(storageKey);
    documentRepository.create.mockResolvedValue(storedDocument);

    const result = await service.create(
      userId,
      {
        name: 'CV principal',
        type: DocumentType.CV,
        applicationId,
      },
      file,
    );

    expect(findApplicationMock).toHaveBeenCalledWith(userId, applicationId);

    expect(saveFileMock).toHaveBeenCalledWith(userId, file);

    expect(documentRepository.create).toHaveBeenCalledWith({
      data: {
        userId,
        name: 'CV principal',
        type: DocumentType.CV,
        storageKey,
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        applications: {
          create: {
            applicationId,
          },
        },
      },
      include: {
        applications: true,
      },
    });

    expect(result.sizeBytes).toBe(1024);
  });

  it('removes the stored file when database creation fails', async () => {
    saveFileMock.mockResolvedValue(storageKey);
    removeFileMock.mockResolvedValue(undefined);

    documentRepository.create.mockRejectedValue(new Error('Database failure'));

    await expect(
      service.create(
        userId,
        {
          name: 'CV principal',
          type: DocumentType.CV,
        },
        file,
      ),
    ).rejects.toThrow('Database failure');

    expect(removeFileMock).toHaveBeenCalledWith(storageKey);
  });

  it('filters documents by authenticated user', async () => {
    documentRepository.findMany.mockResolvedValue([storedDocument]);

    const result = await service.findAll(userId);

    expect(documentRepository.findMany).toHaveBeenCalledWith({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        applications: true,
      },
    });

    expect(result[0]?.sizeBytes).toBe(1024);
  });

  it('returns not found for another user document', async () => {
    documentRepository.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, documentId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(documentRepository.findFirst).toHaveBeenCalledWith({
      where: {
        id: documentId,
        userId,
      },
      include: {
        applications: true,
      },
    });
  });

  it('deletes the verified record and stored file', async () => {
    documentRepository.findFirst.mockResolvedValue(storedDocument);

    documentRepository.delete.mockResolvedValue(storedDocument);

    removeFileMock.mockResolvedValue(undefined);

    await service.remove(userId, documentId);

    expect(documentRepository.delete).toHaveBeenCalledWith({
      where: {
        id: documentId,
      },
    });

    expect(removeFileMock).toHaveBeenCalledWith(storageKey);
  });
});
