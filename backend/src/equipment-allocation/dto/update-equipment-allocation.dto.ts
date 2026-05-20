import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentAllocationDto } from './create-equipment-allocation.dto';

// DTO cập nhật phân bổ thiết bị
export class UpdateEquipmentAllocationDto extends PartialType(CreateEquipmentAllocationDto) {}