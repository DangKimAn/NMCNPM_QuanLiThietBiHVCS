import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReportService } from './report.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomService } from 'src/room/room.service';
import { EventsGateway } from 'src/events/events.gateway';
import { createMockPrismaService } from 'src/test-utils/mock-prisma';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let roomService: jest.Mocked<Partial<RoomService>>;
  let eventsGateway: jest.Mocked<Partial<EventsGateway>>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    roomService = {
      findOne: jest.fn().mockResolvedValue({ roomId: 1, name: 'A201' } as any),
      findAll: jest
        .fn()
        .mockResolvedValue([{ roomId: 1, name: 'A201' }] as any),
    };
    eventsGateway = {
      emitNotification: jest.fn(),
      server: { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: prisma },
        { provide: RoomService, useValue: roomService },
        { provide: EventsGateway, useValue: eventsGateway },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  describe('findOne (Chống IDOR)', () => {
    it('TC-REP-03: Sinh viên/Giảng viên xem phản ánh do mình tạo thành công', async () => {
      const mockReport = {
        reportId: 101,
        reporterId: 5,
        roomId: 1,
        title: 'Hỏng máy chiếu',
        description: 'Máy chiếu không lên nguồn',
        status: 'PENDING',
      };
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.findOne(101, 5, 'STUDENT');
      expect(result.reportId).toBe(101);
      expect(result.room).toEqual({ roomId: 1, name: 'A201' });
    });

    it('TC-REP-04: Sinh viên cố tình xem phản ánh của người khác (IDOR) -> Bị chặn 403 Forbidden', async () => {
      const mockReport = {
        reportId: 101,
        reporterId: 99, // của người khác
        roomId: 1,
      };
      prisma.report.findUnique.mockResolvedValue(mockReport);

      await expect(service.findOne(101, 5, 'STUDENT')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne(101, 5, 'STUDENT')).rejects.toThrow(
        'Bạn không có quyền xem chi tiết phản ánh của tài khoản khác',
      );
    });

    it('TC-REP-05a: Manager được xem phản ánh của bất kỳ ai', async () => {
      const mockReport = {
        reportId: 101,
        reporterId: 99,
        roomId: 1,
      };
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.findOne(101, 1, 'MANAGER');
      expect(result.reportId).toBe(101);
    });

    it('TC-REP-05b: Admin được xem phản ánh của bất kỳ ai', async () => {
      const mockReport = {
        reportId: 101,
        reporterId: 99,
        roomId: 1,
      };
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.findOne(101, 2, 'ADMIN');
      expect(result.reportId).toBe(101);
    });

    it('TC-REP-07: Báo lỗi NotFoundException khi reportId không tồn tại', async () => {
      prisma.report.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999, 1, 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('TC-REP-02: Phân quyền xem danh sách phản ánh', async () => {
      prisma.report.findMany.mockResolvedValue([
        { reportId: 1, roomId: 1, reporterId: 5 },
      ]);
      prisma.report.count.mockResolvedValue(1);

      const result = await service.findAll({
        reporterId: 5,
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ reporterId: 5 }),
        }),
      );
    });
  });
});
