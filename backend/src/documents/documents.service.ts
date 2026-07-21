import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applicationsService: ApplicationsService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    userId: string,
    dto: CreateDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Un fichier est requis.');
    }

    if (dto.applicationId !== undefined) {
      const application = await this.applicationsService.findOne(
        userId,
        dto.applicationId,
      );

      if (application.archivedAt !== null) {
        throw new BadRequestException(
          'Impossible d’associer un document à une candidature archivée.',
        );
      }
    }

    const storageKey = await this.storageService.save(userId, file);

    try {
      const document = await this.prisma.document.create({
        data: {
          userId,
          name: dto.name,
          type: dto.type,
          storageKey,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          applications:
            dto.applicationId !== undefined
              ? {
                  create: {
                    applicationId: dto.applicationId,
                  },
                }
              : undefined,
        },
        include: {
          applications: true,
        },
      });

      return this.serialize(document);
    } catch (error: unknown) {
      await this.storageService.remove(storageKey).catch(() => undefined);

      throw error;
    }
  }

  async findAll(userId: string) {
    const documents = await this.prisma.document.findMany({
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

    return documents.map((document) => this.serialize(document));
  }

  async findOne(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
      include: {
        applications: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document introuvable.');
    }

    return document;
  }

  async update(userId: string, documentId: string, dto: UpdateDocumentDto) {
    await this.findOne(userId, documentId);

    const document = await this.prisma.document.update({
      where: {
        id: documentId,
      },
      data: dto,
      include: {
        applications: true,
      },
    });

    return this.serialize(document);
  }

  async getContent(userId: string, documentId: string) {
    const document = await this.findOne(userId, documentId);

    const content = await this.storageService.read(document.storageKey);

    return {
      document: this.serialize(document),
      content,
    };
  }

  async remove(userId: string, documentId: string) {
    const document = await this.findOne(userId, documentId);

    await this.prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    await this.storageService.remove(document.storageKey);

    return this.serialize(document);
  }

  private serialize<
    T extends {
      sizeBytes: bigint;
      storageKey: string;
    },
  >(document: T) {
    const { storageKey, ...publicDocument } = document;

    void storageKey;

    return {
      ...publicDocument,
      sizeBytes: Number(document.sizeBytes),
    };
  }
}
