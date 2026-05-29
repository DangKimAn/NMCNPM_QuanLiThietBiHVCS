import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

// DTO thêm thiết bị mới
// Mỗi lần thêm thủ công chỉ thêm 1 thiết bị thật
export class CreateEquipmentDto {
  // Mã riêng của từng thiết bị, ví dụ: TB000001
  @IsString()
  equipmentCode!: string;

  // Tên thiết bị
  @IsString()
  name!: string;

  // ID loại thiết bị
  @Type(() => Number)
  @IsInt()
  categoryId!: number;

  // Đơn vị tính, ví dụ: cái, bộ, chiếc
  @IsOptional()
  @IsString()
  unit?: string;

  // Trạng thái thiết bị
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  // Mô tả hoặc ghi chú
  @IsOptional()
  @IsString()
  description?: string;
}