import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EmploymentType, WorkMode } from '../../generated/prisma/enums';

export class ImportJobApplicationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  jobTitle!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  jobUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(150)
  source?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salaryMin?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
