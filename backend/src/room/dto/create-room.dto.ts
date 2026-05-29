import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

// DTO dùng khi thêm phòng học mới
export class CreateRoomDto {
  // Mã phòng, ví dụ: A201, B105
  @IsString()
  code: string;

  // Tên phòng, ví dụ: Phòng học A201
  @IsString()
  name: string;

  // Tòa nhà, có thể không nhập
  @IsOptional()
  @IsString()
  building?: string;

  // Tầng, có thể không nhập
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor?: number;

  // Sức chứa phòng
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity?: number;
}