import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum ImageCategory {
  PRODUCT = 'product',
  USER = 'user',
  CATEGORY = 'category',
  GENERAL = 'general',
}

export class UploadImageDto {
  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsEnum(ImageCategory)
  category?: ImageCategory;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  height?: number;

  @IsOptional()
  @IsString()
  transformation?: string;
}
