import { Transform, type TransformFnParams } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

function trimRequiredText({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim() : input;
}

export class CreateNoteDto {
  @Transform(trimRequiredText)
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}
