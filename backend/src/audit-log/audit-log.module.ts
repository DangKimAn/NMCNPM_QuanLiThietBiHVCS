import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditLogMiddleware } from './audit-log.middleware';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    // JwtModule không cần secret ở đây vì middleware tự lấy từ ConfigService
    JwtModule.register({}),
  ],
  providers: [AuditLogMiddleware],
  exports: [AuditLogMiddleware],
})
export class AuditLogModule {}
