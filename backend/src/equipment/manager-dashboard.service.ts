import { Injectable } from '@nestjs/common';
import { EquipmentStatus, ReportStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../room/room.service';

@Injectable()
export class ManagerDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
  ) {}

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
      allAllocations,
      rawLatestReports,
      rawLatestTransfers,
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

      this.roomService.findAll({}),

      this.prisma.equipmentAllocation.findMany({
        include: {
          equipment: true,
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
          executor: true,
        },
      }),
    ]);

    const roomMap = new Map(rooms.map((r: any) => [r.roomId, r]));

    const roomStats = rooms.map((room: any) => {
      const roomAllocations = allAllocations.filter(a => a.roomId === room.roomId);

      const totalQuantity = roomAllocations.length;

      const activeQuantity = roomAllocations
        .filter((allocation) => {
          return allocation.equipment.status === EquipmentStatus.GOOD;
        }).length;

      const needHandleQuantity = roomAllocations
        .filter((allocation) => {
          const status = allocation.equipment.status;

          return (
            status === EquipmentStatus.BROKEN ||
            status === EquipmentStatus.UNDER_REPAIR
          );
        }).length;

      return {
        roomId: room.roomId,
        code: room.code,
        name: room.name,
        totalQuantity,
        activeQuantity,
        needHandleQuantity,
      };
    });

    const latestReports = rawLatestReports.map(r => ({
      ...r,
      room: roomMap.get(r.roomId) || null
    }));

    const latestTransfers = rawLatestTransfers.map(t => ({
      ...t,
      fromRoom: roomMap.get(t.fromRoomId) || null,
      toRoom: roomMap.get(t.toRoomId) || null
    }));

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