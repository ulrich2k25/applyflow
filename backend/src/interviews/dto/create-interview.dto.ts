import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InterviewStatus, InterviewType } from '../../generated/prisma/enums';

function trimOptionalText({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  if (typeof input !== 'string') {
    return input;
  }

  const trimmedValue = input.trim();

  return trimmedValue === '' ? undefined : trimmedValue;
}

export class CreateInterviewDto {
  @IsEnum(InterviewType)
  type!: InterviewType;

  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsDateString()
  scheduledAt!: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes?: number;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(1000)
  meetingUrl?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string;

  @Transform(trimOptionalText)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
