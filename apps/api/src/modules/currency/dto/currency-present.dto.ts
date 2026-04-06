import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PresentLineItemDto {
  @IsString()
  @MaxLength(128)
  id!: string;

  @IsNumber()
  @Min(-1e15)
  @Max(1e15)
  amount!: number;

  @IsString()
  @MaxLength(16)
  currency!: string;

  @IsDateString()
  valueDate!: string;
}

export class PresentLinesDto {
  @IsString()
  @IsIn(['NOMINAL_COP', 'NOMINAL_USD', 'REAL_COP'])
  display!: string;

  @IsDateString()
  asOfDate!: string;

  @IsOptional()
  @IsDateString()
  realTermsBaseMonth?: string;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PresentLineItemDto)
  lines!: PresentLineItemDto[];
}

export class FxUpsertDto {
  @IsDateString()
  asOfDate!: string;

  @IsString()
  @MaxLength(16)
  quoteCurrency!: string;

  @IsNumber()
  @IsPositive()
  @Max(1e12)
  copPerUnit!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}

export class ConvertCurrencyDto {
  @IsNumber()
  @Min(-1e15)
  @Max(1e15)
  amount!: number;

  @IsString()
  @MaxLength(16)
  from!: string;

  @IsString()
  @MaxLength(16)
  to!: string;

  @IsDateString()
  date!: string;
}
