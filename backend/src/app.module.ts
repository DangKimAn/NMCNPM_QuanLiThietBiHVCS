import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';

// Các module mới cho phần Cán bộ quản lý thiết bị
import { RoomModule } from './room/room.module';
import { EquipmentCategoryModule } from './equipment-category/equipment-category.module';
import { EquipmentModule } from './equipment/equipment.module';
import { EquipmentAllocationModule } from './equipment-allocation/equipment-allocation.module';
import { EquipmentTransferModule } from './equipment-transfer/equipment-transfer.module';
import { ReportModule } from './report/report.module';
import { ManagerDashboardModule } from './manager-dashboard/manager-dashboard.module';

@Module({
  imports: [
    // ConfigModule dùng để đọc biến môi trường trong file .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Module có sẵn của project
    PrismaModule,
    UserModule,
    RoleModule,
    PermissionModule,

    // Module mới cho cán bộ quản lý thiết bị
    RoomModule,
    EquipmentCategoryModule,
    EquipmentModule,
    EquipmentAllocationModule,
    EquipmentTransferModule,
    ReportModule,
    ManagerDashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}