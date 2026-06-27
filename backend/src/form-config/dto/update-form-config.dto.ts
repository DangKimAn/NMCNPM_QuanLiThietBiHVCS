import { IsArray, IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class FormFieldConfigDto {
  @IsString()
  fieldKey: string;

  @IsString()
  label: string;

  @IsString()
  fieldType: string;

  @IsBoolean()
  required: boolean;

  @IsBoolean()
  visible: boolean;

  @IsNumber()
  sortOrder: number;

  @IsOptional()
  @IsString()
  options?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;
}

export class UpdateFormConfigDto {
  @IsArray()
  fields: FormFieldConfigDto[];
}
