import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationTargetRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserRoleName(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user.role.roleName;
  }

  private canViewNotification(
    userRole: string,
    targetRole: NotificationTargetRole,
  ): boolean {
    return targetRole === NotificationTargetRole.ALL || targetRole === userRole;
  }

  async createNotification(userId: number, dto: CreateNotificationDto) {
    const roleName = await this.getUserRoleName(userId);

    if (roleName !== 'MANAGER') {
      throw new ForbiddenException('Chỉ cán bộ quản lý mới được viết thông báo');
    }

    if (!dto.title?.trim()) {
      throw new BadRequestException('Tiêu đề thông báo không được để trống');
    }

    if (!dto.content?.trim()) {
      throw new BadRequestException('Nội dung thông báo không được để trống');
    }

    return this.prisma.notification.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        targetRole: dto.targetRole as NotificationTargetRole,
        senderId: userId,
      },
      include: {
        sender: {
          select: {
            userId: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getMyNotifications(userId: number) {
    const roleName = await this.getUserRoleName(userId);

    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: NotificationTargetRole.ALL },
          { targetRole: roleName as NotificationTargetRole },
          { targetUserId: userId },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            userId: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        reads: {
          where: {
            userId,
          },
          select: {
            readAt: true,
          },
        },
      },
    });

    return notifications.map((item) => ({
      notificationId: item.notificationId,
      title: item.title,
      content: item.content,
      targetRole: item.targetRole,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      sender: item.sender,
      isRead: item.reads.length > 0,
      readAt: item.reads[0]?.readAt ?? null,
    }));
  }

  async countUnread(userId: number) {
    const notifications = await this.getMyNotifications(userId);

    return {
      unreadCount: notifications.filter((item) => !item.isRead).length,
    };
  }

  async markAsRead(userId: number, notificationId: number) {
    const roleName = await this.getUserRoleName(userId);

    const notification = await this.prisma.notification.findUnique({
      where: {
        notificationId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    if (!this.canViewNotification(roleName, notification.targetRole)) {
      throw new ForbiddenException('Bạn không có quyền xem thông báo này');
    }

    return this.prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        notificationId,
        userId,
      },
    });
  }

  async markAllAsRead(userId: number) {
    const notifications = await this.getMyNotifications(userId);

    await this.prisma.notificationRead.createMany({
      data: notifications.map((item) => ({
        notificationId: item.notificationId,
        userId,
      })),
      skipDuplicates: true,
    });

    return {
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
    };
  }

  async deleteNotification(userId: number, notificationId: number) {
    const roleName = await this.getUserRoleName(userId);

    if (roleName !== 'MANAGER') {
      throw new ForbiddenException('Chỉ cán bộ quản lý mới được xóa thông báo');
    }

    const notification = await this.prisma.notification.findUnique({
      where: {
        notificationId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    if (notification.senderId !== userId) {
      throw new ForbiddenException('Bạn chỉ được xóa thông báo do mình tạo');
    }

    await this.prisma.notification.delete({
      where: {
        notificationId,
      },
    });

    return {
      message: 'Xóa thông báo thành công',
    };
  }
}