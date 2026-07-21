import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationsService } from '../applications/applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async create(userId: string, applicationId: string, dto: CreateNoteDto) {
    await this.ensureActiveApplication(userId, applicationId);

    return this.prisma.note.create({
      data: {
        applicationId,
        content: dto.content,
      },
    });
  }

  async findAll(userId: string, applicationId: string) {
    await this.applicationsService.findOne(userId, applicationId);

    return this.prisma.note.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, applicationId: string, noteId: string) {
    await this.applicationsService.findOne(userId, applicationId);

    return this.findNote(applicationId, noteId);
  }

  async update(
    userId: string,
    applicationId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ) {
    await this.ensureActiveApplication(userId, applicationId);

    await this.findNote(applicationId, noteId);

    return this.prisma.note.update({
      where: {
        id: noteId,
      },
      data: dto,
    });
  }

  async remove(userId: string, applicationId: string, noteId: string) {
    await this.ensureActiveApplication(userId, applicationId);

    await this.findNote(applicationId, noteId);

    return this.prisma.note.delete({
      where: {
        id: noteId,
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
        'Impossible de modifier les notes d’une candidature archivée.',
      );
    }

    return application;
  }

  private async findNote(applicationId: string, noteId: string) {
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        applicationId,
      },
    });

    if (!note) {
      throw new NotFoundException('Note introuvable.');
    }

    return note;
  }
}
