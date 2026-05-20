import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'ACCESS_TOKEN_SECRET_KEY_123', // Nên cấu hình trong file .env
    });
  }

  async validate(payload: { sub: number; username: string }) {
    // Tìm kiếm user để lấy thông tin role kèm theo
    const user = await this.prisma.user.findUnique({
      where: { userId: payload.sub },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    // Trả về dữ liệu này sẽ được gán vào request.user
    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role.roleName,
    };
  }
}