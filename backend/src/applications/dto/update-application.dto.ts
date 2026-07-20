import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';

export class UpdateApplicationDto extends PartialType(
  OmitType(CreateApplicationDto, ['companyId'] as const),
) {}
