import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEquipmentAllocationDto } from './create-equipment-allocation.dto';

export class CreateBulkEquipmentAllocationDto {
  @ApiProperty({ type: [CreateEquipmentAllocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentAllocationDto)
  allocations: CreateEquipmentAllocationDto[];
}
