import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@UseGuards(AuthGuard('jwt'))
@Controller('applications/:applicationId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.create(user.userId, applicationId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
  ) {
    return this.notesService.findAll(user.userId, applicationId);
  }

  @Get(':noteId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Param('noteId', ParseUUIDPipe)
    noteId: string,
  ) {
    return this.notesService.findOne(user.userId, applicationId, noteId);
  }

  @Patch(':noteId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Param('noteId', ParseUUIDPipe)
    noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(user.userId, applicationId, noteId, dto);
  }

  @Delete(':noteId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId', ParseUUIDPipe)
    applicationId: string,
    @Param('noteId', ParseUUIDPipe)
    noteId: string,
  ) {
    return this.notesService.remove(user.userId, applicationId, noteId);
  }
}
