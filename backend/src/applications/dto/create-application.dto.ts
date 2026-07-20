import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  ApplicationStatus,
  EmploymentType,
  Priority,
  WorkMode,
} from '../../generated/prisma/enums';

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

function normalizeCurrency({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  if (typeof input !== 'string') {
    return input;
  }

  const normalizedValue = input.trim().toUpperCase();

  return normalizedValue === '' ? undefined : normalizedValue;
}

export class CreateApplicationDto {
  @IsUUID('4')
  companyId!: string;

  @Transform(trimRequiredText)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  jobTitle!: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(1000)
  jobUrl?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  source?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  salaryMin?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  salaryMax?: number;

  @Transform(normalizeCurrency)
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsDateString()
  appliedAt?: string;
}
