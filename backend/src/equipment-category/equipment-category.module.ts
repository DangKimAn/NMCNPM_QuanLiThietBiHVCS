import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { EquipmentCategoryController } from './equipment-category.controller';
import { EquipmentCategoryService } from './equipment-category.service';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentCategoryController],
  providers: [EquipmentCategoryService],
})
export class EquipmentCategoryModule {}