import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEquipmentTransferDto } from './create-equipment-transfer.dto';

export class CreateBulkEquipmentTransferDto {
  @ApiProperty({ type: [CreateEquipmentTransferDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentTransferDto)
  transfers: CreateEquipmentTransferDto[];
}
