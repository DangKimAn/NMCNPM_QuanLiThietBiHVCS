import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
        done(null, secret);
      },      passReqToCallback: true, // Cho phép truyền object `req` vào hàm validate bên dưới
    });
  }

  validate(req: Request, payload: { sub: number; username: string }) {
    // Sử dụng ?. để tránh lỗi 'undefined' nếu client không gửi header
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token hoặc định dạng không hợp lệ');
    }
    
    // Trả về dữ liệu này sẽ được gán vào req.user trong Controller (ví dụ: req.user.refreshToken)
    return {
      userId: payload.sub,
      username: payload.username,
      refreshToken,
    };
  }
}