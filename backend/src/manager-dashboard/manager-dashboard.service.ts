import { Injectable } from '@nestjs/common';
import { EquipmentStatus, ReportStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ManagerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // API tổng quan cho trang dashboard của cán bộ quản lý thiết bị
  async getOverview() {
    const [
      totalDevices,
      activeDevices,
      brokenDevices,
      repairingDevices,
      discardedDevices,
      totalReports,
      pendingReports,
      processingReports,
      resolvedReports,
      rejectedReports,
      rooms,
      latestReports,
      latestTransfers,
    ] = await Promise.all([
      // Tổng số thiết bị
      this.prisma.equipment.count(),

      // Thiết bị hoạt động tốt
      this.prisma.equipment.count({
        where: { status: EquipmentStatus.GOOD },
      }),

      // Thiết bị báo hỏng
      this.prisma.equipment.count({
        where: { status: EquipmentStatus.BROKEN },
      }),

      // Thiết bị đang sửa
      this.prisma.equipment.count({
        where: { status: EquipmentStatus.UNDER_REPAIR },
      }),

      // Thiết bị thanh lý
      this.prisma.equipment.count({
        where: { status: EquipmentStatus.DISCARDED },
      }),

      // Tổng phản ánh
      this.prisma.report.count(),

      // Phản ánh mới tiếp nhận
      this.prisma.report.count({
        where: { status: ReportStatus.PENDING },
      }),

      // Phản ánh đang xử lý
      this.prisma.report.count({
        where: { status: ReportStatus.PROCESSING },
      }),

      // Phản ánh đã xử lý
      this.prisma.report.count({
        where: { status: ReportStatus.RESOLVED },
      }),

      // Phản ánh bị từ chối
      this.prisma.report.count({
        where: { status: ReportStatus.REJECTED },
      }),

      // Danh sách phòng kèm thiết bị được phân bổ
      this.prisma.room.findMany({
        orderBy: { roomId: 'asc' },
        include: {
          allocations: {
            include: {
              equipment: true,
            },
          },
        },
      }),

      // 5 phản ánh mới nhất
      this.prisma.report.findMany({
        take: 5,
        orderBy: { reportedAt: 'desc' },
        include: {
          reporter: true,
          handler: true,
          room: true,
          equipment: true,
        },
      }),

      // 5 lần điều chuyển gần nhất
      this.prisma.equipmentTransfer.findMany({
        take: 5,
        orderBy: { transferredAt: 'desc' },
        include: {
          equipment: true,
          fromRoom: true,
          toRoom: true,
          executor: true,
        },
      }),
    ]);

    // Thống kê thiết bị theo từng phòng học
    const roomStats = rooms.map((room) => {
      const totalQuantity = room.allocations.reduce(
        (sum, allocation) => sum + allocation.quantity,
        0,
      );

      const activeQuantity = room.allocations
        .filter((allocation) => allocation.equipment.status === EquipmentStatus.GOOD)
        .reduce((sum, allocation) => sum + allocation.quantity, 0);

      const needHandleQuantity = room.allocations
        .filter((allocation) => {
          const status = allocation.equipment.status;

          return (
            status === EquipmentStatus.BROKEN ||
            status === EquipmentStatus.UNDER_REPAIR
          );
        })
        .reduce((sum, allocation) => sum + allocation.quantity, 0);

      return {
        roomId: room.roomId,
        code: room.code,
        name: room.name,
        totalQuantity,
        activeQuantity,
        needHandleQuantity,
      };
    });

    return {
      equipmentSummary: {
        total: totalDevices,
        active: activeDevices,
        needHandle: brokenDevices + repairingDevices,
        broken: brokenDevices,
        repairing: repairingDevices,
        discarded: discardedDevices,
      },

      reportSummary: {
        total: totalReports,
        pending: pendingReports,
        processing: processingReports,
        resolved: resolvedReports,
        rejected: rejectedReports,
      },

      deviceStatusStats: [
        {
          status: EquipmentStatus.GOOD,
          label: 'Hoạt động',
          count: activeDevices,
        },
        {
          status: EquipmentStatus.BROKEN,
          label: 'Báo hỏng',
          count: brokenDevices,
        },
        {
          status: EquipmentStatus.UNDER_REPAIR,
          label: 'Đang sửa',
          count: repairingDevices,
        },
        {
          status: EquipmentStatus.DISCARDED,
          label: 'Thanh lý',
          count: discardedDevices,
        },
      ],

      roomStats,
      latestReports,
      latestTransfers,
    };
  }
}