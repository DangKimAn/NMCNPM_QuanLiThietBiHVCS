import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEquipmentCategoryDto {
  @ApiProperty({
    example: 'Thiết bị trình chiếu',
    description: 'Tên loại thiết bị',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Bao gồm máy chiếu, màn chiếu, thiết bị hỗ trợ trình chiếu',
    description: 'Mô tả loại thiết bị',
  })
  @IsOptional()
  @IsString()
  description?: string;
}