import { PartialType } from '@nestjs/swagger';

import { CreateEquipmentCategoryDto } from './create-equipment-category.dto';

export class UpdateEquipmentCategoryDto extends PartialType(
  CreateEquipmentCategoryDto,
) {}