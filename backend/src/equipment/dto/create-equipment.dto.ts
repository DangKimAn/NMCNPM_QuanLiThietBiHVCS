import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

// DTO thêm thiết bị mới
export class CreateEquipmentDto {
  // Tên thiết bị
  @IsString()
  name: string;

  // ID loại thiết bị
  @Type(() => Number)
  @IsInt()
  categoryId: number;

  // Đơn vị tính, ví dụ: cái, bộ, chiếc
  @IsOptional()
  @IsString()
  unit?: string;

  // Tổng số lượng thiết bị
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  // Trạng thái: GOOD, BROKEN, UNDER_REPAIR, DISCARDED
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  // Mô tả hoặc ghi chú
  @IsOptional()
  @IsString()
  description?: string;
}