import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  street: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  number: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartment?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  state: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  zipCode: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
