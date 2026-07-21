import { IsString, Length } from 'class-validator';

export class TokenDto {
  @IsString()
  @Length(64, 64)
  token!: string;
}
