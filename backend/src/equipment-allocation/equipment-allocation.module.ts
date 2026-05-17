import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { EquipmentAllocationController } from './equipment-allocation.controller';
import { EquipmentAllocationService } from './equipment-allocation.service';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentAllocationController],
  providers: [EquipmentAllocationService],
})
export class EquipmentAllocationModule {}