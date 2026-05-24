// src/auth/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Do JwtStrategy của bạn map ID vào biến 'userId' ở req.user, nên ta sẽ ưu tiên lấy userId hoặc payload.sub
    const user = request.user;
    if (!user) return null;
    
    return {
      userId: user.userId || user.sub,
      role: user.role,
    };
  },
);