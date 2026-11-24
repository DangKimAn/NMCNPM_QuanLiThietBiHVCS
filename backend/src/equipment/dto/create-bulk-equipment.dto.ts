import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

export class BulkEquipmentItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  equipmentCode?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsInt()
  categoryId!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roomId?: number;
}

export class CreateBulkEquipmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkEquipmentItemDto)
  equipments!: BulkEquipmentItemDto[];
}
