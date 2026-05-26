import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * HTTP Logger Middleware
 *
 * Ghi log mọi HTTP request vào console + file (app.log).
 * Format: [METHOD] /path → status | Xms | IP
 *
 * Áp dụng cho TẤT CẢ routes (GET, POST, PUT, PATCH, DELETE...)
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') ?? '-';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const elapsed = Date.now() - startTime;
      const contentLength = res.get('content-length') ?? '-';

      const logData = {
        method,
        url: originalUrl,
        statusCode,
        elapsed: `${elapsed}ms`,
        contentLength,
        ip,
        userAgent,
      };

      // Chọn log level theo status code
      if (statusCode >= 500) {
        this.logger.error(`[HTTP] ${method} ${originalUrl}`, logData);
      } else if (statusCode >= 400) {
        this.logger.warn(`[HTTP] ${method} ${originalUrl}`, logData);
      } else {
        this.logger.http(`[HTTP] ${method} ${originalUrl}`, logData);
      }
    });

    next();
  }
}
