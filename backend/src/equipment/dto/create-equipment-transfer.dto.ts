import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateEquipmentTransferDto {
  @ApiProperty({
    example: 1,
    description: 'ID thiết bị cần điều chuyển',
  })
  @IsInt()
  @IsNotEmpty()
  equipmentId!: number;

  @ApiProperty({
    example: 1,
    description: 'ID phòng chuyển đi',
  })
  @IsInt()
  @IsNotEmpty()
  fromRoomId!: number;

  @ApiProperty({
    example: 2,
    description: 'ID phòng chuyển đến',
  })
  @IsInt()
  @IsNotEmpty()
  toRoomId!: number;


  @ApiProperty({
    example: '2026-05-20',
    description: 'Ngày điều chuyển',
  })
  @IsDateString()
  transferredAt!: string;

  @ApiProperty({
    example: 1,
    description: 'ID cán bộ thực hiện điều chuyển',
  })
  @IsInt()
  @IsNotEmpty()
  executorId!: number;

  @ApiPropertyOptional({
    example: 'Chuyển máy chiếu sang phòng A102 để phục vụ giảng dạy',
    description: 'Lý do hoặc ghi chú điều chuyển',
  })
  @IsOptional()
  @IsString()
  note?: string;
}