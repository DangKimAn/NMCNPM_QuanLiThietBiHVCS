import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Đảm bảo thư mục logs tồn tại
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Cấu hình Winston logger cho toàn bộ ứng dụng.
 *
 * Outputs:
 *  - Console: format màu sắc, dễ đọc khi dev
 *  - logs/app.log: tất cả log (info trở lên)
 *  - logs/error.log: chỉ error
 *  - logs/audit.log: chỉ audit log từ AuditLogMiddleware
 */
export const winstonConfig: winston.LoggerOptions = {
  // Mức log tối thiểu
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),

  transports: [
    // ── Console (chỉ dùng khi dev) ──────────────────────────────────
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        nestWinstonModuleUtilities.format.nestLike('HVCS', {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),

    // ── File: tất cả log ≥ info ─────────────────────────────────────
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true,
    }),

    // ── File: chỉ error ─────────────────────────────────────────────
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),

    // ── File: audit log riêng ───────────────────────────────────────
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      maxsize: 20 * 1024 * 1024, // 20 MB
      maxFiles: 10,
      tailable: true,
      // Chỉ ghi những entry có label 'AUDIT'
      format: winston.format.combine(
        winston.format((info) => (info['label'] === 'AUDIT' ? info : false))(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
    }),
  ],

  // Bắt unhandled exception & rejection → ghi ra file
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
};
