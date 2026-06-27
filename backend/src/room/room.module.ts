import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}