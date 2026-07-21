import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DocumentType } from '../../generated/prisma/enums';

function trimText({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim() : input;
}

export class CreateDocumentDto {
  @Transform(trimText)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsOptional()
  @IsUUID()
  applicationId?: string;
}
