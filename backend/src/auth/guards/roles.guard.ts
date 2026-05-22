// src/auth/guard/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../decorators/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách roles được định nghĩa trên API (hỗ trợ cả ở cấp Class và Method)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu API không định nghĩa role nào -> Cho phép truy cập mặc định (chỉ cần log in thành công)
    if (!requiredRoles) {
      return true;
    }

    // 2. Lấy thông tin user từ request (đã được JwtAuthGuard điền vào trước đó)
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new UnauthorizedException('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn');
    }

    if (!user.role) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    // 3. Kiểm tra xem role của user có nằm trong danh sách được phép không
    const hasRole = requiredRoles.includes(user.role);
    
    if (!hasRole) {
      throw new ForbiddenException('Tài khoản của bạn không đủ thẩm quyền');
    }

    return true;
  }
}