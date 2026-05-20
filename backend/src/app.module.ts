import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';

import { RoomModule } from './room/room.module';
import { EquipmentModule } from './equipment/equipment.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PrismaModule,

    UserModule,
    RoleModule,
    PermissionModule,

    RoomModule,
    EquipmentModule,
    ReportModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}