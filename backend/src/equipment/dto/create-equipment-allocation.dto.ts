import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateEquipmentAllocationDto {
  @ApiProperty({
    example: 1,
    description: 'ID thiết bị cần gắn vào phòng',
  })
  @IsInt()
  @IsNotEmpty()
  equipmentId!: number;

  @ApiProperty({
    example: 1,
    description: 'ID phòng học',
  })
  @IsInt()
  @IsNotEmpty()
  roomId!: number;


  @ApiProperty({
    example: '2026-05-20',
    description: 'Ngày gắn thiết bị vào phòng',
  })
  @IsDateString()
  allocatedAt!: string;

  @ApiPropertyOptional({
    example: 'Gắn máy chiếu vào phòng A101',
    description: 'Ghi chú phân bổ thiết bị',
  })
  @IsOptional()
  @IsString()
  note?: string;
}