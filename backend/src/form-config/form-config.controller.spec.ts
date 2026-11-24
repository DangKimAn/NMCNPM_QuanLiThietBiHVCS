import { Test, TestingModule } from '@nestjs/testing';
import { FormConfigController } from './form-config.controller';
import { FormConfigService } from './form-config.service';

describe('FormConfigController', () => {
  let controller: FormConfigController;
  let service: jest.Mocked<Partial<FormConfigService>>;

  beforeEach(async () => {
    service = {
      getAllForms: jest
        .fn()
        .mockResolvedValue([
          { formKey: 'report_incident', formName: 'Báo hỏng' },
        ] as any),
      getConfig: jest.fn().mockResolvedValue({
        formKey: 'report_incident',
        fields: [{ key: 'title', label: 'Tiêu đề', required: true }],
      } as any),
      updateConfig: jest.fn().mockResolvedValue({
        formKey: 'report_incident',
        fields: [],
      } as any),
      deleteField: jest
        .fn()
        .mockResolvedValue({ message: 'Xóa trường thành công' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormConfigController],
      providers: [{ provide: FormConfigService, useValue: service }],
    }).compile();

    controller = module.get<FormConfigController>(FormConfigController);
  });

  it('TC-FORM-01: Lấy cấu hình form theo formKey', async () => {
    const result = await controller.getConfig('report_incident');
    expect(result.formKey).toBe('report_incident');
    expect(service.getConfig).toHaveBeenCalledWith('report_incident');
  });

  it('TC-FORM-02: Admin cập nhật cấu hình form', async () => {
    const dto = {
      fields: [
        {
          key: 'notes',
          label: 'Ghi chú',
          type: 'text',
          required: false,
          order: 1,
        },
      ],
    };
    const result = await controller.updateConfig('report_incident', dto as any);
    expect(result.formKey).toBe('report_incident');
    expect(service.updateConfig).toHaveBeenCalledWith('report_incident', dto);
  });

  it('TC-FORM-03: Lấy danh sách tất cả các form có cấu hình', async () => {
    const result = await controller.getAllForms();
    expect(result).toHaveLength(1);
    expect(service.getAllForms).toHaveBeenCalled();
  });
});
