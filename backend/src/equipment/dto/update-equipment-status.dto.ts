import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

// DTO cập nhật trạng thái thiết bị
export class UpdateEquipmentStatusDto {
  // Trạng thái mới của thiết bị
  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;

  // Ghi chú cập nhật trạng thái
  @IsOptional()
  @IsString()
  description?: string;
}