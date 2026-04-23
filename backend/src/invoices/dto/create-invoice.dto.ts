import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsInt()
  @Min(1)
  clientId: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  series?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  number: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
