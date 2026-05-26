import {
  Controller,
  Get,
  Query,
  UseGuards,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/decorators/role.enum';

@ApiTags('AuditLog')
@ApiBearerAuth()
@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLogs(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('username') username?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const take = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    const skip = page ? (parseInt(page, 10) - 1) * take : 0;

    const where: any = {};

    if (username && username.trim()) {
      where.user = {
        username: { contains: username.trim(), mode: 'insensitive' },
      };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          user: { select: { username: true, userId: true } },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page:  page  ? parseInt(page, 10)  : 1,
      limit: take,
    };
  }

  @Patch(':logId/mark')
  async toggleMark(
    @Param('logId') logId: string,
    @Body('isMarked') isMarked: boolean,
  ) {
    const updated = await this.prisma.activityLog.update({
      where: { logId: Number(logId) },
      data: { isMarked: Boolean(isMarked) },
    });
    return updated;
  }
}
