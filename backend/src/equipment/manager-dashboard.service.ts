import { Injectable } from '@nestjs/common';
import { EquipmentStatus, ReportStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ManagerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

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
      this.prisma.equipment.count(),

      this.prisma.equipment.count({
        where: {
          status: EquipmentStatus.GOOD,
        },
      }),

      this.prisma.equipment.count({
        where: {
          status: EquipmentStatus.BROKEN,
        },
      }),

      this.prisma.equipment.count({
        where: {
          status: EquipmentStatus.UNDER_REPAIR,
        },
      }),

      this.prisma.equipment.count({
        where: {
          status: EquipmentStatus.DISCARDED,
        },
      }),

      this.prisma.report.count(),

      this.prisma.report.count({
        where: {
          status: ReportStatus.PENDING,
        },
      }),

      this.prisma.report.count({
        where: {
          status: ReportStatus.PROCESSING,
        },
      }),

      this.prisma.report.count({
        where: {
          status: ReportStatus.RESOLVED,
        },
      }),

      this.prisma.report.count({
        where: {
          status: ReportStatus.REJECTED,
        },
      }),

      this.prisma.room.findMany({
        orderBy: {
          roomId: 'asc',
        },
        include: {
          allocations: {
            include: {
              equipment: true,
            },
          },
        },
      }),

      this.prisma.report.findMany({
        take: 5,
        orderBy: {
          reportedAt: 'desc',
        },
        include: {
          reporter: true,
          handler: true,
          room: true,
          equipment: true,
        },
      }),

      this.prisma.equipmentTransfer.findMany({
        take: 5,
        orderBy: {
          transferredAt: 'desc',
        },
        include: {
          equipment: true,
          fromRoom: true,
          toRoom: true,
          executor: true,
        },
      }),
    ]);

    const roomStats = rooms.map((room) => {
      const totalQuantity = room.allocations.reduce(
        (sum, allocation) => sum + allocation.quantity,
        0,
      );

      const activeQuantity = room.allocations
        .filter((allocation) => {
          return allocation.equipment.status === EquipmentStatus.GOOD;
        })
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