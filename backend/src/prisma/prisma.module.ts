import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaController } from './prisma.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports :[ConfigModule],
  controllers: [PrismaController],
  providers: [PrismaService],
  exports:[PrismaService]
})
export class PrismaModule {}
