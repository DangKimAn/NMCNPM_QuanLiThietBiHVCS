import { IsOptional, IsString } from 'class-validator';

// DTO thêm loại thiết bị
export class CreateEquipmentCategoryDto {
  // Tên loại thiết bị, ví dụ: Trình chiếu, Âm thanh, Điện lạnh
  @IsString()
  name: string;

  // Mô tả loại thiết bị
  @IsOptional()
  @IsString()
  description?: string;
}