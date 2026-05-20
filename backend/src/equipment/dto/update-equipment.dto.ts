import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentDto } from './create-equipment.dto';

// DTO cập nhật thông tin thiết bị
export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}