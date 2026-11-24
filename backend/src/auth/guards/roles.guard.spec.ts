import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../decorators/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  it('TC-GUARD-01: Cho phép truy cập nếu endpoint không gắn @Roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: Role.STUDENT });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('TC-GUARD-02: Cho phép truy cập nếu role của user nằm trong danh sách requiredRoles', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.MANAGER]);
    const context = createMockContext({ role: Role.ADMIN });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('TC-GUARD-03: Ném lỗi ForbiddenException nếu role của user không nằm trong danh sách', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ role: Role.STUDENT });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Tài khoản của bạn không đủ thẩm quyền',
    );
  });

  it('TC-GUARD-04: Ném lỗi UnauthorizedException nếu chưa đăng nhập (user is null/undefined)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('TC-GUARD-05: Ném lỗi ForbiddenException nếu user không có thuộc tính role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const context = createMockContext({ role: null });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Bạn không có quyền truy cập tài nguyên này',
    );
  });
});
