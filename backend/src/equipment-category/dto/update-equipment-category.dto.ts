import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentCategoryDto } from './create-equipment-category.dto';

// DTO cập nhật loại thiết bị
export class UpdateEquipmentCategoryDto extends PartialType(CreateEquipmentCategoryDto) {}