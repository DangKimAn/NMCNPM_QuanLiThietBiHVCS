import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogMiddleware } from './audit-log.middleware';
import { winstonConfig } from 'src/common/logger/logger.config';

// Controller được đăng ký trong AppModule để tránh circular dependency với AuthModule
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.register({}),
    WinstonModule.forRoot(winstonConfig),
  ],
  providers: [AuditLogMiddleware],
  exports: [AuditLogMiddleware],
})
export class AuditLogModule {}
