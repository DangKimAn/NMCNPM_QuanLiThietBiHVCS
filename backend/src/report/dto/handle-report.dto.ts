import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '@prisma/client';

// DTO xử lý phản ánh báo hỏng
// Dùng cho Cán bộ quản lý thiết bị
export class HandleReportDto {
  // Trạng thái xử lý phản ánh
  // PENDING, PROCESSING, RESOLVED, REJECTED
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  // ID cán bộ xử lý phản ánh
  @Type(() => Number)
  @IsInt()
  handlerId!: number;

  // Ghi chú xử lý
  @IsOptional()
  @IsString()
  resolutionContent?: string;

  // Kết quả xử lý ngắn gọn
  @IsOptional()
  @IsString()
  result?: string;
}