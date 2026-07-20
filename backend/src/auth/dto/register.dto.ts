import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim().toLowerCase() : input;
}

function trimText({ value }: TransformFnParams): unknown {
  const input: unknown = value;

  return typeof input === 'string' ? input.trim() : input;
}

export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @Transform(trimText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @Transform(trimText)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;
}
