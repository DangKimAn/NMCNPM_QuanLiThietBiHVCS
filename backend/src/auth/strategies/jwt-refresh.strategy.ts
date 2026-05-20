import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'REFRESH_TOKEN_SECRET_KEY_456', // Nên cấu hình trong file .env khi deploy thực tế
      passReqToCallback: true, // Cho phép truyền object `req` vào hàm validate bên dưới
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