// src/report/report.service.ts
import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, ReportStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

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
          room: {
            code: { contains: query.search, mode: 'insensitive' },
          },
        },
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

    return this.prisma.report.findMany({
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
        room: true,
        equipment: {
          include: {
            category: true,
          },
        },
      },
    });
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
        room: true,
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

    return report;
  }

  // Gửi phản ánh báo hỏng lên hệ thống (STUDENT & TEACHER)
  async create(dto: CreateReportDto, userId: number) {
    const reporter = await this.prisma.user.findUnique({
      where: { userId: userId }, 
    });

    if (!reporter) {
      throw new BadRequestException('Người gửi phản ánh không tồn tại hoặc chưa đăng nhập');
    }

    const room = await this.prisma.room.findUnique({
      where: { roomId: dto.roomId },
    });

    if (!room) {
      throw new BadRequestException('Phòng học không tồn tại');
    }

    if (dto.equipmentId) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { equipmentId: dto.equipmentId },
      });

      if (!equipment) {
        throw new BadRequestException('Thiết bị không tồn tại');
      }
    }

    return this.prisma.report.create({
      data: {
        reporterId: userId, 
        roomId: dto.roomId,
        equipmentId: dto.equipmentId,
        reportContent: dto.reportContent,
        status: ReportStatus.PENDING,
      },
      include: {
        reporter: true,
        room: true,
        equipment: true,
      },
    });
  }

  // Xử lý phản ánh dành riêng cho MANAGER
  async handle(reportId: number, dto: HandleReportDto, handlerId: number) {
    // Truyền đầy đủ tham số nội bộ để hàm findOne không bị lỗi biên dịch
    await this.findOne(reportId, handlerId, 'MANAGER');

    const handler = await this.prisma.user.findUnique({
      where: { userId: handlerId },
    });

    if (!handler) {
      throw new BadRequestException('Người xử lý không tồn tại hoặc phiên đăng nhập hết hạn');
    }

    const shouldSetResolvedAt =
      dto.status === ReportStatus.RESOLVED || dto.status === ReportStatus.REJECTED;

    return this.prisma.report.update({
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
        room: true,
        equipment: true,
      },
    });
  }
}