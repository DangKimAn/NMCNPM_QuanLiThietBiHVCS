// src/report/report.service.ts
import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, ReportStatus, EquipmentStatus, NotificationTargetRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';
import { RoomService } from '../room/room.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async populateRoomsForReports(reports: any[]) {
    if (!reports.length) return reports;
    const rooms = await this.roomService.findAll({});
    const roomMap = new Map(rooms.map((r: any) => [r.roomId, r]));

    return reports.map(report => ({
      ...report,
      room: roomMap.get(report.roomId) || null
    }));
  }

  private async populateRoomForSingleReport(report: any) {
    if (!report) return null;
    const room = await this.roomService.findOne(report.roomId);
    return { ...report, room };
  }

  // Lấy danh sách phản ánh
  async findAll(query: {
    status?: ReportStatus;
    roomId?: number;
    equipmentId?: number;
    search?: string;
    reporterId?: number;
  }) {
    const where: Prisma.ReportWhereInput = {};

    if (query.reporterId) {
      where.reporterId = query.reporterId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.roomId) {
      where.roomId = query.roomId;
    }

    if (query.equipmentId) {
      where.equipmentId = query.equipmentId;
    }

    if (query.search) {
      where.OR = [
        { reportContent: { contains: query.search, mode: 'insensitive' } },
        { resolutionContent: { contains: query.search, mode: 'insensitive' } },
        { result: { contains: query.search, mode: 'insensitive' } },
        {
          equipment: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          reporter: {
            username: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: {
        reportedAt: 'desc',
      },
      include: {
        reporter: {
          include: {
            role: true,
          },
        },
        handler: {
          include: {
            role: true,
          },
        },
        equipment: {
          include: {
            category: true,
          },
        },
      },
    });

    return this.populateRoomsForReports(reports);
  }

  // Lấy chi tiết một phản ánh - ĐÃ TÍCH HỢP KIỂM TRA CHÍNH CHỦ
  async findOne(reportId: number, currentUserId: number, currentUserRole: string) {
    const report = await this.prisma.report.findUnique({
      where: { reportId },
      include: {
        reporter: {
          include: {
            role: true,
          },
        },
        handler: {
          include: {
            role: true,
          },
        },
        equipment: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Không tìm thấy phản ánh');
    }

    //LOGIC CHECK CHÍNH CHỦ:
    // Nếu KHÔNG PHẢI Manager, hệ thống bắt buộc reporterId (người tạo) phải trùng với ID người đang xem
    if (currentUserRole !== 'MANAGER' && report.reporterId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền xem chi tiết phản ánh của tài khoản khác');
    }

    return this.populateRoomForSingleReport(report);
  }

  // Gửi phản ánh báo hỏng lên hệ thống (STUDENT & TEACHER)
  async create(dto: CreateReportDto, userId: number) {
    const reporter = await this.prisma.user.findUnique({
      where: { userId: userId }, 
    });

    if (!reporter) {
      throw new BadRequestException('Người gửi phản ánh không tồn tại hoặc chưa đăng nhập');
    }

    const room = await this.roomService.findOne(dto.roomId);
    if (!room) {
      throw new BadRequestException('Phòng học không tồn tại trên hệ thống ROOM_API');
    }

    if (dto.equipmentId) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { equipmentId: dto.equipmentId },
      });

      if (!equipment) {
        throw new BadRequestException('Thiết bị không tồn tại');
      }

      await this.prisma.equipment.update({
        where: { equipmentId: dto.equipmentId },
        data: { status: EquipmentStatus.BROKEN },
      });
    }

    const result = await this.prisma.report.create({
      data: {
        reporterId: userId, 
        roomId: dto.roomId,
        equipmentId: dto.equipmentId,
        reportContent: dto.reportContent,
        status: ReportStatus.PENDING,
      },
      include: {
        reporter: true,
        equipment: true,
      },
    });

    // Tạo thông báo cho Manager
    const notification = await this.prisma.notification.create({
      data: {
        title: `Phản ánh mới từ ${reporter.fullName || reporter.username}`,
        content: `[ID:${result.reportId}] Phòng ${room.name}: ${dto.reportContent}`,
        targetRole: 'MANAGER',
        senderId: userId,
      },
    });

    const populatedResult = await this.populateRoomForSingleReport(result);

    // Phát sự kiện realtime
    this.eventsGateway.emitReportCreated(populatedResult);
    this.eventsGateway.emitNotification(notification);

    return populatedResult;
  }

  // Xử lý phản ánh dành riêng cho MANAGER
  async handle(reportId: number, dto: HandleReportDto, handlerId: number) {
    // Truyền đầy đủ tham số nội bộ để hàm findOne không bị lỗi biên dịch
    const report = await this.findOne(reportId, handlerId, 'MANAGER');

    const handler = await this.prisma.user.findUnique({
      where: { userId: handlerId },
    });

    if (!handler) {
      throw new BadRequestException('Người xử lý không tồn tại hoặc phiên đăng nhập hết hạn');
    }

    const shouldSetResolvedAt =
      dto.status === ReportStatus.RESOLVED || dto.status === ReportStatus.REJECTED;

    const result = await this.prisma.report.update({
      where: { reportId },
      data: {
        status: dto.status,
        handlerId: handlerId, 
        resolutionContent: dto.resolutionContent,
        result: dto.result,
        resolvedAt: shouldSetResolvedAt ? new Date() : null,
      },
      include: {
        reporter: true,
        handler: true,
        equipment: true,
      },
    });

    if (report.equipmentId) {
      let equipmentStatus: EquipmentStatus;
      switch (dto.status) {
        case ReportStatus.PROCESSING:
          equipmentStatus = EquipmentStatus.UNDER_REPAIR;
          break;
        case ReportStatus.RESOLVED:
        case ReportStatus.REJECTED:
          equipmentStatus = EquipmentStatus.GOOD;
          break;
        case ReportStatus.PENDING:
        default:
          equipmentStatus = EquipmentStatus.BROKEN;
          break;
      }

      await this.prisma.equipment.update({
        where: { equipmentId: report.equipmentId },
        data: { status: equipmentStatus },
      });
    }

    const statusTextMap = {
      [ReportStatus.PROCESSING]: 'Đang xử lý',
      [ReportStatus.RESOLVED]: 'Đã xử lý',
      [ReportStatus.REJECTED]: 'Từ chối',
      [ReportStatus.PENDING]: 'Mới tiếp nhận',
    };

    const notification = await this.prisma.notification.create({
      data: {
        title: `Phản ánh của bạn đã được cập nhật: ${statusTextMap[dto.status]}`,
        content: `Phản ánh thiết bị ${report.equipment?.name || 'Không xác định'} tại phòng ${report.room?.name || 'Không xác định'} đã được chuyển sang trạng thái ${statusTextMap[dto.status]}.${dto.resolutionContent ? `\n\nGhi chú: ${dto.resolutionContent}` : ''}`,
        targetRole: report.reporter.role.roleName as NotificationTargetRole,
        targetUserId: report.reporterId,
        senderId: handlerId,
      },
    });

    const populatedResult = await this.populateRoomForSingleReport(result);

    // Phát sự kiện realtime
    this.eventsGateway.emitReportUpdated(populatedResult);
    this.eventsGateway.emitNotification(notification);

    return populatedResult;
  }
}