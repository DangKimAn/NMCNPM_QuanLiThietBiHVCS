import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: jest.Mocked<Partial<HealthService>>;

  beforeEach(async () => {
    service = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        info: { database: { status: 'up' } },
        details: { database: { status: 'up' } },
      } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: service }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('TC-HEALTH-01: Kiểm tra sức khỏe hệ thống (Health Check)', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.info.database.status).toBe('up');
    expect(service.check).toHaveBeenCalled();
  });
});
