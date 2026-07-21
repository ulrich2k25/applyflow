import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@UseGuards(AuthGuard('jwt'))
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE,
      },
    }),
  )
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_FILE_SIZE,
        })
        .addFileTypeValidator({
          fileType: 'application/pdf',
        })
        .build({
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.documentsService.create(user.userId, dto, file);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.findAll(user.userId);
  }

  @Get(':documentId/download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId', ParseUUIDPipe)
    documentId: string,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const { document, content } = await this.documentsService.getContent(
      user.userId,
      documentId,
    );

    response.set({
      'Content-Type': document.mimeType,
      'Content-Length': content.length.toString(),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
    });

    return new StreamableFile(content);
  }

  @Get(':documentId')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId', ParseUUIDPipe)
    documentId: string,
  ) {
    const document = await this.documentsService.findOne(
      user.userId,
      documentId,
    );

    return {
      ...document,
      sizeBytes: Number(document.sizeBytes),
    };
  }

  @Patch(':documentId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId', ParseUUIDPipe)
    documentId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(user.userId, documentId, dto);
  }

  @Delete(':documentId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('documentId', ParseUUIDPipe)
    documentId: string,
  ) {
    return this.documentsService.remove(user.userId, documentId);
  }
}
