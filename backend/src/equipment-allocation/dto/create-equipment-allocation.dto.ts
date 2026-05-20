import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

// DTO gắn thiết bị vào phòng học
// Dấu ! dùng để báo với TypeScript rằng các field này sẽ được truyền từ request body
export class CreateEquipmentAllocationDto {
  // ID thiết bị
  @Type(() => Number)
  @IsInt()
  equipmentId!: number;

  // ID phòng học
  @Type(() => Number)
  @IsInt()
  roomId!: number;

  // Số lượng thiết bị gắn vào phòng
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  // Ngày phân bổ, có thể không nhập
  @IsOptional()
  @IsDateString()
  allocatedAt?: string;

  // Ghi chú, có thể không nhập
  @IsOptional()
  @IsString()
  note?: string;
}