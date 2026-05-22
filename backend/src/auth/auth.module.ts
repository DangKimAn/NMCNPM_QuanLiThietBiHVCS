import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule, 
    PassportModule.register({ defaultStrategy: 'jwt' }), //Cấu hình Passport nhận mặc định jwt
    JwtModule.register({
      secret: 'ACCESS_TOKEN_SECRET_KEY_123', // Khớp với khóa bên JwtStrategy
      signOptions: { expiresIn: '1d' },
    }), 
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], //BẮT BUỘC phải điền JwtStrategy vào đây để NestJS khởi tạo nó
  exports: [AuthService, PassportModule, JwtModule], //Export ra ngoài cho các Module khác xài chung Guard
})
export class AuthModule {}