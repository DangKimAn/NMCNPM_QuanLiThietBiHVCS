import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoomModule } from '../room/room.module';

import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

import { EquipmentCategoryController } from './equipment-category.controller';
import { EquipmentCategoryService } from './equipment-category.service';

import { EquipmentAllocationController } from './equipment-allocation.controller';
import { EquipmentAllocationService } from './equipment-allocation.service';

import { EquipmentTransferController } from './equipment-transfer.controller';
import { EquipmentTransferService } from './equipment-transfer.service';

import { ManagerDashboardController } from './manager-dashboard.controller';
import { ManagerDashboardService } from './manager-dashboard.service';

@Module({
  imports: [PrismaModule, RoomModule],

  controllers: [
    EquipmentController,
    EquipmentCategoryController,
    EquipmentAllocationController,
    EquipmentTransferController,
    ManagerDashboardController,
  ],

  providers: [
    EquipmentService,
    EquipmentCategoryService,
    EquipmentAllocationService,
    EquipmentTransferService,
    ManagerDashboardService,
  ],
})
export class EquipmentModule {}