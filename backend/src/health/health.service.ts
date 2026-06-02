import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const startedAt = new Date().toISOString();

    // Ping database bằng cách chạy một query đơn giản
    let dbStatus: 'ok' | 'error' = 'ok';
    let dbLatencyMs: number | null = null;
    let dbError: string | null = null;

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
    } catch (err: any) {
      dbStatus = 'error';
      dbError = err?.message ?? 'Unknown database error';
    }

    const uptimeSeconds = Math.floor(process.uptime());
    const memoryUsage = process.memoryUsage();

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: startedAt,
      uptime: {
        seconds: uptimeSeconds,
        human: formatUptime(uptimeSeconds),
      },
      database: {
        status: dbStatus,
        provider: 'Supabase / PostgreSQL',
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      memory: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}
