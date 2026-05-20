import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { EquipmentTransferController } from './equipment-transfer.controller';
import { EquipmentTransferService } from './equipment-transfer.service';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentTransferController],
  providers: [EquipmentTransferService],
})
export class EquipmentTransferModule {}