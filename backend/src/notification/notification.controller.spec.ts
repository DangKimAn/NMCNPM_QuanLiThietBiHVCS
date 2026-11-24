import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: jest.Mocked<Partial<NotificationService>>;

  const mockReq = {
    user: { userId: 5, role: 'MANAGER' },
  } as any;

  beforeEach(async () => {
    service = {
      getMyNotifications: jest
        .fn()
        .mockResolvedValue([
          { notificationId: 1, title: 'Bảo trì phòng A201', isRead: false },
        ] as any),
      createNotification: jest.fn().mockResolvedValue({
        notificationId: 2,
        title: 'Thông báo mới',
      } as any),
      countUnread: jest.fn().mockResolvedValue({ unreadCount: 3 } as any),
      markAsRead: jest
        .fn()
        .mockResolvedValue({ message: 'Đã đánh dấu đã đọc' } as any),
      markAllAsRead: jest
        .fn()
        .mockResolvedValue({ message: 'Đã đọc tất cả' } as any),
      clearAllNotifications: jest
        .fn()
        .mockResolvedValue({ message: 'Đã xóa tất cả thông báo' } as any),
      deleteNotification: jest
        .fn()
        .mockResolvedValue({ message: 'Đã xóa thông báo' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: service }],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('TC-NOTI-01: Lấy danh sách thông báo của user hiện tại', async () => {
    const result = await controller.getMyNotifications(mockReq);
    expect(result).toHaveLength(1);
    expect(service.getMyNotifications).toHaveBeenCalledWith(5);
  });

  it('TC-NOTI-02: Manager tạo thông báo mới', async () => {
    const dto = {
      title: 'Thông báo mới',
      message: 'Nội dung',
      targetRole: 'ALL' as any,
    };
    const result = await controller.createNotification(mockReq, dto);
    expect(result.notificationId).toBe(2);
    expect(service.createNotification).toHaveBeenCalledWith(5, dto);
  });

  it('TC-NOTI-03: Đếm số lượng thông báo chưa đọc', async () => {
    const result = await controller.countUnread(mockReq);
    expect(result.unreadCount).toBe(3);
    expect(service.countUnread).toHaveBeenCalledWith(5);
  });

  it('TC-NOTI-04: Đánh dấu 1 thông báo là đã đọc', async () => {
    const result = await controller.markAsRead(mockReq, 1);
    expect(result).toHaveProperty('message');
    expect(service.markAsRead).toHaveBeenCalledWith(5, 1);
  });

  it('TC-NOTI-05: Đánh dấu tất cả thông báo là đã đọc', async () => {
    const result = await controller.markAllAsRead(mockReq);
    expect(result).toHaveProperty('message');
    expect(service.markAllAsRead).toHaveBeenCalledWith(5);
  });

  it('TC-NOTI-06: Admin xóa toàn bộ thông báo (clear-all)', async () => {
    const result = await controller.clearAllNotifications();
    expect(result.message).toBe('Đã xóa tất cả thông báo');
    expect(service.clearAllNotifications).toHaveBeenCalled();
  });

  it('TC-NOTI-07: Xóa thông báo theo ID', async () => {
    const result = await controller.deleteNotification(mockReq, 1);
    expect(result).toHaveProperty('message');
    expect(service.deleteNotification).toHaveBeenCalledWith(5, 1);
  });
});
