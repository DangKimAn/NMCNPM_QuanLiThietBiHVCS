import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  }) {
    const where: Prisma.ReportWhereInput = {};

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

  // Lấy chi tiết một phản ánh
  async findOne(reportId: number) {
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

    return report;
  }

  // ✨ SỬA Ở ĐÂY: Nhận thêm tham số userId từ Controller truyền sang
  async create(dto: CreateReportDto, userId: number) {
    const reporter = await this.prisma.user.findUnique({
      where: { userId: userId }, //Thay vì tin dùng dto.reporterId, dùng luôn userId bảo mật từ token
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
        reporterId: userId, // Đưa dữ liệu sạch từ Token vào DB
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

  // ✨ SỬA Ở ĐÂY: Nhận thêm tham số handlerId để gán đúng quản lý xử lý ứng dụng
  async handle(reportId: number, dto: HandleReportDto, handlerId: number) {
    await this.findOne(reportId);

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
        handlerId: handlerId, // Tự động cập nhật ID của Manager đang thực hiện gọi API này
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