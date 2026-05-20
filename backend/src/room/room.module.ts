import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}