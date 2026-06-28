import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/role.enum';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationService } from './notification.service';

type AuthRequest = Request & {
  user?: {
    userId?: number;
    sub?: number;
    id?: number;
    role?: string;
    roleName?: string;
  };
};

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Lấy userId từ token đăng nhập.
  // Tùy project có thể lưu là userId, sub hoặc id.
  private getCurrentUserId(req: AuthRequest): number {
    const userId = req.user?.userId ?? req.user?.sub ?? req.user?.id;

    return Number(userId);
  }

  // Tất cả role đều được xem thông báo của mình
  // GET /notifications
  @Get()
  async getMyNotifications(@Req() req: AuthRequest) {
    const userId = this.getCurrentUserId(req);
    return this.notificationService.getMyNotifications(userId);
  }

  // Đếm số thông báo chưa đọc
  // GET /notifications/unread-count
  @Get('unread-count')
  async countUnread(@Req() req: AuthRequest) {
    const userId = this.getCurrentUserId(req);
    return this.notificationService.countUnread(userId);
  }

  // MANAGER và ADMIN được viết thông báo
  // POST /notifications
  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  async createNotification(
    @Req() req: AuthRequest,
    @Body() dto: CreateNotificationDto,
  ) {
    const userId = this.getCurrentUserId(req);
    return this.notificationService.createNotification(userId, dto);
  }

  // Đánh dấu 1 thông báo là đã đọc
  // POST /notifications/:id/read
  @Post(':id/read')
  async markAsRead(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    const userId = this.getCurrentUserId(req);
    return this.notificationService.markAsRead(userId, notificationId);
  }

  // Đánh dấu tất cả thông báo là đã đọc
  // POST /notifications/read-all
  @Post('read-all')
  async markAllAsRead(@Req() req: AuthRequest) {
    const userId = this.getCurrentUserId(req);
    return this.notificationService.markAllAsRead(userId);
  }

  // MANAGER và ADMIN được xóa thông báo do mình tạo
  // DELETE /notifications/:id
  @Delete(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  async deleteNotification(
    @Req() req: AuthRequest,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    const userId = this.getCurrentUserId(req);
    return this.notificationService.deleteNotification(userId, notificationId);
  }

  // ADMIN: Xóa tất cả thông báo (dọn dẹp)
  // DELETE /notifications/clear-all
  @Delete('clear-all')
  @Roles(Role.ADMIN)
  async clearAllNotifications() {
    return this.notificationService.clearAllNotifications();
  }
}