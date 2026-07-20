import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimRequiredText({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim() : input;
}

function trimOptionalText({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  if (typeof input !== 'string') {
    return input;
  }

  const trimmedValue = input.trim();

  return trimmedValue === '' ? undefined : trimmedValue;
}

function normalizeOptionalEmail({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  if (typeof input !== 'string') {
    return input;
  }

  const normalizedValue = input.trim().toLowerCase();

  return normalizedValue === '' ? undefined : normalizedValue;
}
export class CreateCompanyDto {
  @Transform(trimRequiredText)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(500)
  website?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  industry?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  city?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string;

  @Transform(normalizeOptionalEmail)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
