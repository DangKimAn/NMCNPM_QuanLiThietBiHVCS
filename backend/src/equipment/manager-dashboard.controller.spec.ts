import { Test, TestingModule } from '@nestjs/testing';
import { ManagerDashboardController } from './manager-dashboard.controller';
import { ManagerDashboardService } from './manager-dashboard.service';

describe('ManagerDashboardController', () => {
  let controller: ManagerDashboardController;
  let service: jest.Mocked<Partial<ManagerDashboardService>>;

  beforeEach(async () => {
    service = {
      getOverview: jest.fn().mockResolvedValue({
        summary: {
          totalRooms: 20,
          totalEquipments: 150,
          totalActiveReports: 3,
        },
        equipmentStatus: {
          AVAILABLE: 140,
          BROKEN: 5,
          MAINTENANCE: 5,
        },
        recentActivities: [],
      } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagerDashboardController],
      providers: [
        { provide: ManagerDashboardService, useValue: service },
      ],
    }).compile();

    controller = module.get<ManagerDashboardController>(ManagerDashboardController);
  });

  it('TC-DASH-01: Lấy số liệu tổng quan Dashboard thành công', async () => {
    const result = await controller.getOverview();
    expect(result.summary.totalEquipments).toBe(150);
    expect(result.equipmentStatus.AVAILABLE).toBe(140);
    expect(service.getOverview).toHaveBeenCalled();
  });
});
