import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

// DTO tạo phản ánh báo hỏng
// Dùng cho giảng viên/sinh viên gửi phản ánh
export class CreateReportDto {
  // ID người gửi phản ánh
  @Type(() => Number)
  @IsInt()
  reporterId!: number;

  // ID phòng học xảy ra sự cố
  @Type(() => Number)
  @IsInt()
  roomId!: number;

  // ID thiết bị liên quan, có thể không nhập nếu phản ánh chung về phòng học
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  equipmentId?: number;

  // Nội dung phản ánh
  @IsString()
  reportContent!: string;
}