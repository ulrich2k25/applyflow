import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApplicationStatus, Priority } from '../../generated/prisma/enums';

export enum ApplicationSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DEADLINE = 'deadline',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

function trimOptionalText({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  if (typeof input !== 'string') {
    return input;
  }

  const trimmedValue = input.trim();

  return trimmedValue === '' ? undefined : trimmedValue;
}

export class QueryApplicationsDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsUUID('4')
  companyId?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsEnum(ApplicationSortBy)
  sortBy: ApplicationSortBy = ApplicationSortBy.UPDATED_AT;

  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
