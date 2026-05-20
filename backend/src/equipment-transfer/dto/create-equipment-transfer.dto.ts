import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

// DTO dùng để điều chuyển thiết bị từ phòng này sang phòng khác
export class CreateEquipmentTransferDto {
  // ID thiết bị cần điều chuyển
  @Type(() => Number)
  @IsInt()
  equipmentId!: number;

  // ID phòng hiện tại
  @Type(() => Number)
  @IsInt()
  fromRoomId!: number;

  // ID phòng mới
  @Type(() => Number)
  @IsInt()
  toRoomId!: number;

  // Số lượng thiết bị cần điều chuyển
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  // Ngày điều chuyển
  @IsDateString()
  transferredAt!: string;

  // ID người thực hiện điều chuyển
  @Type(() => Number)
  @IsInt()
  executorId!: number;

  // Ghi chú hoặc lý do điều chuyển
  @IsOptional()
  @IsString()
  note?: string;
}