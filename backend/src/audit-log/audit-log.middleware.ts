import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

// HTTP method → tên hành động tiếng Việt
const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'Tạo mới',
  PUT: 'Cập nhật (toàn bộ)',
  PATCH: 'Cập nhật',
  DELETE: 'Xóa',
};

// Các route auth không cần log (không có userId)
const SKIP_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/verify-otp',
  '/api/auth/reset-password',
  '/api/auth/google',
  '/api/auth/logout',
];

/**
 * Parse URL path để lấy tên resource và targetId.
 *
 * Ví dụ:
 *  /api/equipments/5           → { target: 'equipments', targetId: 5 }
 *  /api/equipment-categories/3 → { target: 'equipment-categories', targetId: 3 }
 *  /api/equipments             → { target: 'equipments', targetId: 0 }
 */
function parseTarget(url: string): { target: string; targetId: number } {
  // Bỏ query string
  const pathname = url.split('?')[0];
  // Bỏ prefix /api/
  const withoutPrefix = pathname.replace(/^\/api\//, '');
  const parts = withoutPrefix.split('/').filter(Boolean);

  const target = parts[0] ?? 'unknown';
  const rawId = parts[1];
  // Chỉ lấy nếu là số nguyên dương
  const targetId = rawId && /^\d+$/.test(rawId) ? parseInt(rawId, 10) : 0;

  return { target, targetId };
}

/**
 * Trích xuất message từ response body.
 * Hỗ trợ: { message: '...' }, { message: [...] }, string thuần.
 */
function extractMessage(body: unknown): string | null {
  if (!body) return null;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      return (body as string).slice(0, 500);
    }
  }

  if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;

    // Ưu tiên trường "message"
    if ('message' in obj) {
      const msg = obj['message'];
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
    }

    // Fallback: stringify toàn bộ (giới hạn 500 ký tự)
    return JSON.stringify(body).slice(0, 500);
  }

  return null;
}

/**
 * Lấy IP thực của client (xử lý proxy/reverse-proxy).
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Chỉ log các method thay đổi dữ liệu
    const method = req.method.toUpperCase();
    if (!METHOD_ACTION_MAP[method]) {
      return next();
    }

    // Bỏ qua các route auth
    const path = req.path;
    if (SKIP_PATHS.some((skip) => path.startsWith(skip))) {
      return next();
    }

    // Lấy userId từ JWT token (nếu có)
    let userId: number | null = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        const payload = this.jwtService.verify<{ sub: number }>(token, {
          secret,
        });
        userId = payload.sub;
      } catch {
        // Token không hợp lệ hoặc hết hạn → bỏ qua, không log
      }
    }

    // Nếu không xác định được user thì bỏ qua (userId NOT NULL trong DB)
    if (!userId) {
      return next();
    }

    const action = METHOD_ACTION_MAP[method];
    const { target, targetId } = parseTarget(req.originalUrl);
    const route = req.originalUrl;
    const content = `[${method}] ${route}`;
    const ipAddress = getClientIp(req);
    const userAgent = req.get('user-agent') ?? '-';

    // ─── Chặn response body để lấy message ───────────────────────
    let capturedBody: unknown = null;
    const originalJson = res.json.bind(res) as (body: unknown) => Response;
    res.json = (body: unknown): Response => {
      capturedBody = body;
      return originalJson(body);
    };

    // Ghi log SAU KHI response hoàn tất
    res.on('finish', () => {
      const statusCode = res.statusCode;
      const responseMessage = extractMessage(capturedBody);

      // Log tất cả request (kể cả lỗi 4xx, 5xx) để audit đầy đủ
      this.prisma.activityLog
        .create({
          data: {
            userId,
            action,
            target,
            targetId,
            method,
            route,
            statusCode,
            responseMessage,
            content,
            ipAddress,
            userAgent,
          },
        })
        .then(() => {
          const auditEntry = {
            label: 'AUDIT',
            userId,
            action,
            target,
            targetId: targetId || undefined,
            method,
            route,
            statusCode,
            responseMessage,
            ipAddress,
            userAgent,
          };

          this.logger.info(
            `[AuditLog] userId=${userId} | ${method} ${route} | ${action} ${target}${targetId ? `#${targetId}` : ''} | ${statusCode} | "${responseMessage ?? '-'}"`,
            auditEntry,
          );
        })
        .catch((err: unknown) => {
          this.logger.error('[AuditLog] Lỗi ghi log vào DB:', {
            label: 'AUDIT',
            error: err instanceof Error ? err.message : String(err),
            userId,
            method,
            route,
          });
        });
    });

    next();
  }
}
