import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(
  OmitType(CreateDocumentDto, ['applicationId'] as const),
) {}
