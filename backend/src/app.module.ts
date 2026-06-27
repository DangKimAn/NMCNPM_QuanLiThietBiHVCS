import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuditLogMiddleware } from './audit-log/audit-log.middleware';
import { AuditLogController } from './audit-log/audit-log.controller';
import { FormConfigController } from './form-config/form-config.controller';

import { PrismaModule } from './prisma/prisma.module';

import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';

import { RoomModule } from './room/room.module';
import { EquipmentModule } from './equipment/equipment.module';
import { ReportModule } from './report/report.module';
import { AuthModule } from './auth/auth.module';

import { NotificationModule } from './notification/notification.module';
import { HealthModule } from './health/health.module';
import { EventsModule } from './events/events.module';

import { FormConfigModule } from './form-config/form-config.module';

import { winstonConfig } from './common/logger/logger.config';
import { HttpLoggerMiddleware } from './common/logger/http-logger.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Logger toàn cục — dùng nest-winston thay Logger mặc định của NestJS
    WinstonModule.forRoot(winstonConfig),

    PrismaModule,

    UserModule,
    RoleModule,
    PermissionModule,

    RoomModule,
    EquipmentModule,
    ReportModule,
    AuthModule,
    AuditLogModule,

    // Đăng ký chức năng thông báo
    // Tất cả role xem được thông báo
    // Chỉ MANAGER được viết thông báo
    NotificationModule,
    FormConfigModule,
    HealthModule,
    EventsModule,
  ],

  // AuditLogController & FormConfigController đăng ký ở AppModule để dùng JwtAuthGuard/RolesGuard từ AuthModule
  controllers: [AppController, AuditLogController, FormConfigController],
  providers: [AppService, GlobalExceptionFilter],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1. HTTP Logger: áp dụng cho TẤT CẢ routes
    consumer.apply(HttpLoggerMiddleware).forRoutes('*path');

    // 2. Audit Log: chỉ log các method thay đổi dữ liệu
    consumer
      .apply(AuditLogMiddleware)
      .forRoutes(
        { path: '*path', method: RequestMethod.POST },
        { path: '*path', method: RequestMethod.PUT },
        { path: '*path', method: RequestMethod.PATCH },
        { path: '*path', method: RequestMethod.DELETE },
      );
  }
}