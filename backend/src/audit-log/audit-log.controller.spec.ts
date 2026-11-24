import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { createMockPrismaService } from 'src/test-utils/mock-prisma';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
  });

  it('TC-AUDIT-01: Admin lấy danh sách logs có phân trang', async () => {
    prisma.activityLog.findMany.mockResolvedValue([
      { logId: 1, action: 'Cập nhật', target: 'user', user: { username: 'admin', userId: 1 } },
    ]);
    prisma.activityLog.count.mockResolvedValue(1);

    const result = await controller.getLogs('10', '1', 'admin');
    expect(result.total).toBe(1);
    expect(result.logs).toHaveLength(1);
    expect(prisma.activityLog.findMany).toHaveBeenCalled();
  });

  it('TC-AUDIT-03: Admin đánh dấu (toggleMark) bản ghi audit log', async () => {
    prisma.activityLog.update.mockResolvedValue({
      logId: 1,
      isMarked: true,
    });

    const result = await controller.toggleMark('1', true);
    expect(result.isMarked).toBe(true);
    expect(prisma.activityLog.update).toHaveBeenCalledWith({
      where: { logId: 1 },
      data: { isMarked: true },
    });
  });
});
